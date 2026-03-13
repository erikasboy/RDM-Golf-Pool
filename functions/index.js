const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

admin.initializeApp();
const db = admin.firestore();

// ─── Scoring Table ───────────────────────────────────────────────────────────
function getPoints(position, status, roundsPlayed) {
  if (status === "cut") return -2;
  if (status === "dq") return -2;
  if (status === "wd") {
    return roundsPlayed <= 2 ? -2 : 0;
  }

  if (position === null || position === undefined) return 0;

  if (position === 1) return 10;
  if (position === 2) return 7;
  if (position === 3) return 6;
  if (position === 4) return 5;
  if (position === 5) return 4;
  if (position >= 6 && position <= 10) return 3;
  if (position >= 11 && position <= 20) return 2;
  if (position >= 21 && position <= 30) return 1;
  return 0;
}

// ─── Helper: verify caller is admin ──────────────────────────────────────────
async function requireAdmin(auth) {
  if (!auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }
  const userDoc = await db.collection("users").doc(auth.uid).get();
  if (!userDoc.exists || !userDoc.data().isAdmin) {
    throw new HttpsError("permission-denied", "Admin access required.");
  }
}

// ─── Helper: parse position string ───────────────────────────────────────────
function parsePosition(posStr) {
  if (!posStr) return null;
  const cleaned = posStr.replace(/[T\s]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

// ─── 1. Import Field ─────────────────────────────────────────────────────────
exports.importField = onCall(async (request) => {
  await requireAdmin(request.auth);
  const { tournamentKey } = request.data;
  if (!tournamentKey) {
    throw new HttpsError("invalid-argument", "tournamentKey is required.");
  }

  // Get tournament doc to find ESPN event ID
  const tournDoc = await db.collection("tournaments").doc(tournamentKey).get();
  if (!tournDoc.exists) {
    throw new HttpsError("not-found", "Tournament not found.");
  }

  const { espnEventId } = tournDoc.data();
  if (!espnEventId) {
    throw new HttpsError(
      "failed-precondition",
      "Tournament has no ESPN event ID."
    );
  }

  const fieldUrl = `https://www.espn.com/golf/field/_/tournamentId/${espnEventId}`;
  const leaderboardUrl = `https://www.espn.com/golf/leaderboard/_/tournamentId/${espnEventId}`;
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  };

  // Try the field page first; fall back to leaderboard (field page 404s mid-tournament)
  let res = await fetch(fieldUrl, { headers });
  if (!res.ok) {
    res = await fetch(leaderboardUrl, { headers });
    if (!res.ok) {
      throw new HttpsError(
        "unavailable",
        `ESPN returned status ${res.status}`
      );
    }
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const golfers = [];

  // ESPN field page uses table rows with player data
  // Try multiple selector strategies for robustness
  $("table tbody tr").each((_i, row) => {
    const cells = $(row).find("td");
    if (cells.length >= 1) {
      // Player name is usually in a link within the first or second cell
      let name = null;
      cells.each((_j, cell) => {
        const link = $(cell).find("a");
        if (link.length && !name) {
          const text = link.text().trim();
          // Filter out non-name links (like "Course Stats")
          if (text && !text.includes("Stats") && !text.includes("http")) {
            name = text;
          }
        }
      });

      if (!name) {
        // Fallback: look for player name in any cell text
        const firstCellText = $(cells[0]).text().trim();
        if (firstCellText && firstCellText.length > 2 && firstCellText.length < 50) {
          name = firstCellText;
        }
      }

      if (name) {
        // Try to extract country from flag image alt text
        const flagImg = $(row).find('img[class*="flag"], img[alt]');
        let country = "";
        if (flagImg.length) {
          country = flagImg.attr("alt") || "";
        }

        golfers.push({ name, country });
      }
    }
  });

  // Also check for JSON-LD or embedded __espnfitt__ data as fallback
  if (golfers.length === 0) {
    const scripts = $("script").toArray();
    for (const script of scripts) {
      const content = $(script).html();
      if (content && content.includes("__espnfitt__")) {
        try {
          const match = content.match(
            /window\['__espnfitt__'\]\s*=\s*(\{[\s\S]*?\});/
          );
          if (match) {
            const data = JSON.parse(match[1]);
            const competitors =
              data?.page?.content?.events?.[0]?.competitors || [];
            for (const c of competitors) {
              golfers.push({
                name: c.athlete?.displayName || c.name || "",
                country: c.athlete?.flag?.alt || "",
              });
            }
          }
        } catch (_e) {
          // JSON parse failed, skip
        }
      }
    }
  }

  if (golfers.length === 0) {
    throw new HttpsError(
      "internal",
      "Could not parse any golfers from ESPN field page. The page structure may have changed."
    );
  }

  // Store field
  await db.collection("fields").doc(tournamentKey).set({ golfers });

  // Update tournament status
  await db
    .collection("tournaments")
    .doc(tournamentKey)
    .update({ status: "field_set" });

  return { success: true, count: golfers.length };
});

// ─── 2. Import Results ───────────────────────────────────────────────────────
exports.importResults = onCall(async (request) => {
  await requireAdmin(request.auth);
  const { tournamentKey } = request.data;
  if (!tournamentKey) {
    throw new HttpsError("invalid-argument", "tournamentKey is required.");
  }

  const tournDoc = await db.collection("tournaments").doc(tournamentKey).get();
  if (!tournDoc.exists) {
    throw new HttpsError("not-found", "Tournament not found.");
  }

  const { espnEventId, year } = tournDoc.data();
  if (!espnEventId) {
    throw new HttpsError(
      "failed-precondition",
      "Tournament has no ESPN event ID."
    );
  }

  const url = `https://www.espn.com/golf/leaderboard/_/tournamentId/${espnEventId}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!res.ok) {
    throw new HttpsError(
      "unavailable",
      `ESPN returned status ${res.status}`
    );
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const positions = [];

  // ESPN leaderboard table structure (2025):
  // Table 0 = playoff results (if any), Table 1 = main leaderboard
  // Columns: [empty], POS, PLAYER, SCORE, R1, R2, R3, R4, TOT, EARNINGS, FEDEX PTS
  // CUT/WD rows: POS="-", SCORE="CUT"/"WD"
  const tables = $("table");
  // Use last table (main leaderboard), skip playoff table if present
  const mainTable = tables.length > 1 ? tables.eq(tables.length - 1) : tables.eq(0);

  mainTable.find("tbody tr").each((_i, row) => {
    const cells = $(row).find("td");
    if (cells.length < 4) return;

    // Column 1 = POS, Column 2 = PLAYER, Column 3 = SCORE
    const posText = $(cells[1]).text().trim();
    const name = $(cells[2]).text().trim();
    const scoreText = $(cells[3]).text().trim();

    if (!name) return;

    // Determine status from POS and SCORE columns
    const scoreLower = scoreText.toLowerCase();
    let status = "complete";
    let position = null;
    let score = scoreText;

    if (scoreLower === "cut" || scoreLower === "mc") {
      status = "cut";
    } else if (scoreLower === "wd" || scoreLower === "w/d") {
      status = "wd";
    } else if (scoreLower === "dq") {
      status = "dq";
    } else {
      position = parsePosition(posText);
    }

    // Count rounds played from R1-R4 columns (indices 4-7)
    let rounds = 0;
    const roundScores = [];
    for (let c = 4; c <= 7 && c < cells.length; c++) {
      const text = $(cells[c]).text().trim();
      roundScores.push(text || "--");
      if (text && text !== "--") {
        rounds++;
      }
    }
    if (rounds === 0) {
      rounds = status === "cut" ? 2 : status === "complete" ? 4 : 0;
    }

    const points = getPoints(position, status, rounds);

    positions.push({ name, position, score, status, rounds, points, roundScores });
  });

  // Fallback: try parsing from embedded JSON data
  if (positions.length === 0) {
    const scripts = $("script").toArray();
    for (const script of scripts) {
      const content = $(script).html();
      if (content && content.includes("__espnfitt__")) {
        try {
          const match = content.match(
            /window\['__espnfitt__'\]\s*=\s*(\{[\s\S]*?\});/
          );
          if (match) {
            const data = JSON.parse(match[1]);
            const competitors =
              data?.page?.content?.leaderboard?.competitors || [];
            for (const c of competitors) {
              const posText = c.status?.position?.displayValue || c.pos || "";
              const posLower = posText.toLowerCase();
              let status = "complete";
              let position = null;

              if (posLower === "cut" || posLower === "mc") {
                status = "cut";
              } else if (posLower === "wd" || posLower === "w/d") {
                status = "wd";
              } else if (posLower === "dq") {
                status = "dq";
              } else {
                position = parsePosition(posText);
              }

              const rounds = c.rounds?.length || (status === "cut" ? 2 : 4);
              const points = getPoints(position, status, rounds);

              positions.push({
                name: c.athlete?.displayName || "",
                position,
                score: c.score?.displayValue || c.toPar || "",
                status,
                rounds,
                points,
              });
            }
          }
        } catch (_e) {
          // JSON parse failed, skip
        }
      }
    }
  }

  if (positions.length === 0) {
    throw new HttpsError(
      "internal",
      "Could not parse any results from ESPN leaderboard. The page structure may have changed."
    );
  }

  // Store results
  await db.collection("results").doc(tournamentKey).set({ positions });

  // Update tournament status
  await db
    .collection("tournaments")
    .doc(tournamentKey)
    .update({ status: "completed" });

  // Recalculate standings
  if (year) {
    await recalculateStandings(year);
  }

  return { success: true, count: positions.length };
});

// ─── 3. Calculate Standings ──────────────────────────────────────────────────
async function recalculateStandings(year) {
  // Get all tournaments for this year
  const tournamentsSnap = await db
    .collection("tournaments")
    .where("year", "==", year)
    .get();

  const tournamentKeys = tournamentsSnap.docs.map((d) => d.id);
  const tournamentNames = {};
  tournamentsSnap.docs.forEach((d) => {
    tournamentNames[d.id] = d.data().shortName || d.id;
  });

  // Get all results
  const resultsByTournament = {};
  for (const key of tournamentKeys) {
    const resultDoc = await db.collection("results").doc(key).get();
    if (resultDoc.exists) {
      resultsByTournament[key] = resultDoc.data().positions || [];
    }
  }

  // Get all picks for this year
  const picksSnap = await db
    .collection("picks")
    .where("year", "==", year)
    .get();

  // Group picks by user
  const picksByUser = {};
  picksSnap.docs.forEach((d) => {
    const pick = d.data();
    if (!picksByUser[pick.userId]) {
      picksByUser[pick.userId] = [];
    }
    picksByUser[pick.userId].push(pick);
  });

  // Get user display names
  const userIds = Object.keys(picksByUser);
  const userNames = {};
  for (const uid of userIds) {
    const userDoc = await db.collection("users").doc(uid).get();
    if (userDoc.exists) {
      userNames[uid] = userDoc.data().displayName || userDoc.data().email;
    }
  }

  // Calculate points for each user
  const rankings = [];
  for (const userId of userIds) {
    const breakdown = {};
    let totalPoints = 0;

    for (const pick of picksByUser[userId]) {
      const tKey = pick.tournamentKey;
      const results = resultsByTournament[tKey];
      if (!results) continue;

      let tournamentPoints = 0;
      for (const golferName of pick.golfers || []) {
        const result = results.find(
          (r) => r.name.toLowerCase() === golferName.toLowerCase()
        );
        if (result) {
          tournamentPoints += result.points;
        }
      }

      const shortName = tournamentNames[tKey] || tKey;
      breakdown[shortName] = tournamentPoints;
      totalPoints += tournamentPoints;
    }

    rankings.push({
      userId,
      displayName: userNames[userId] || userId,
      totalPoints,
      breakdown,
    });
  }

  // Sort by total points descending
  rankings.sort((a, b) => b.totalPoints - a.totalPoints);

  // Store standings
  await db.collection("standings").doc(String(year)).set({
    rankings,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  });

  return rankings;
}

exports.calculateStandings = onCall(async (request) => {
  await requireAdmin(request.auth);
  const { year } = request.data;
  if (!year) {
    throw new HttpsError("invalid-argument", "year is required.");
  }

  const rankings = await recalculateStandings(year);
  return { success: true, count: rankings.length };
});

// ─── 4. Create Participant ──────────────────────────────────────────────────
const crypto = require("crypto");

exports.createParticipant = onCall(async (request) => {
  await requireAdmin(request.auth);
  const { email, displayName } = request.data;

  if (!email || !displayName) {
    throw new HttpsError(
      "invalid-argument",
      "email and displayName are required."
    );
  }

  // Create Firebase Auth user with a random temporary password
  const tempPassword = crypto.randomBytes(16).toString("hex");
  let userRecord;
  try {
    userRecord = await admin.auth().createUser({
      email,
      displayName,
      password: tempPassword,
    });
  } catch (err) {
    if (err.code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "A user with that email already exists.");
    }
    throw new HttpsError("internal", err.message);
  }

  // Create Firestore user doc
  await db.collection("users").doc(userRecord.uid).set({
    email,
    displayName,
    isAdmin: false,
  });

  // Generate password reset link
  const resetLink = await admin.auth().generatePasswordResetLink(email);

  return { uid: userRecord.uid, resetLink };
});
