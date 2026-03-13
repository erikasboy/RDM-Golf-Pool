import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import WeatherForecast from "../components/WeatherForecast";

const STATUS_COLORS = {
  upcoming: "bg-blue-600",
  field_set: "bg-yellow-600",
  active: "bg-green-600",
  completed: "bg-gray-600",
};

const STATUS_LABELS = {
  upcoming: "Upcoming",
  field_set: "Field Set",
  active: "Active",
  completed: "Completed",
};

// Using Unsplash Source for reliable hotlinking - these are thematic golf images
// since specific course photos are typically copyrighted
const COURSE_INFO = {
  "TPC Sawgrass": {
    title: "The Stadium Course at TPC Sawgrass",
    image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1280&q=80",
    imageCredit: "Photo by Courtney Cook on Unsplash",
    description:
      "Welcome to TPC Sawgrass, home of The Players Championship — the unofficial fifth major. " +
      "Pete Dye's Stadium Course is a masterwork of strategic design, where every shot demands precision and nerve. " +
      "The course winds through Florida wetlands, its fairways framed by towering pines and menacing water hazards. " +
      "And then there's the 17th — the most famous par-3 in all of golf. That island green, surrounded by nothing " +
      "but water and the hopes of the world's best players. More balls have found their watery grave here than anywhere " +
      "else on tour. The roar of the crowd as a tee shot holds the putting surface — or the collective gasp as one " +
      "catches the edge and tumbles into the deep — this is theater, ladies and gentlemen. Pure, unadulterated theater.",
  },
  "Augusta National Golf Club": {
    title: "Augusta National Golf Club",
    image: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1280&q=80",
    imageCredit: "Photo by Robert Ruggiero on Unsplash",
    description:
      "A tradition unlike any other. Augusta National is hallowed ground — the cathedral of golf. " +
      "Co-designed by Bobby Jones and Alister MacKenzie, these pristine fairways have hosted the Masters Tournament " +
      "since 1934, and every blade of grass tells a story. The towering Georgia pines. The impossibly fast, " +
      "undulating greens. Amen Corner — the stretch of holes 11, 12, and 13 where tournaments are won and lost, " +
      "where the azaleas bloom in brilliant pinks and purples and the waters of Rae's Creek wait patiently for " +
      "an errant shot. The 12th hole, Golden Bell, is just 155 yards — and yet it has broken more hearts than any " +
      "hole in championship golf. When a player slips on that green jacket on Sunday evening, they join an exclusive " +
      "fraternity. They become part of history.",
  },
  "Quail Hollow Club": {
    title: "Quail Hollow Club",
    image: "https://images.unsplash.com/photo-1592919505780-303950717480?w=1280&q=80",
    imageCredit: "Photo by Lo Sarno on Unsplash",
    description:
      "Quail Hollow Club in Charlotte, North Carolina — where the Green Mile awaits. " +
      "This Tom Fazio design has become one of the PGA Tour's most demanding tests, hosting the Wells Fargo Championship " +
      "and the 2017 PGA Championship. The course weaves through towering hardwoods and across rolling Piedmont terrain, " +
      "building to a brutal finishing stretch. The Green Mile — holes 16, 17, and 18 — is among the most difficult " +
      "closing stretches in championship golf. The 18th, a 494-yard par-4 with water guarding the green, has decided " +
      "more tournaments than players care to remember. When the pressure mounts and the crowds roar, Quail Hollow " +
      "separates the pretenders from the contenders.",
  },
  "Oakmont Country Club": {
    title: "Oakmont Country Club",
    image: "https://images.unsplash.com/photo-1600005082646-12d5789d0d54?w=1280&q=80",
    imageCredit: "Photo by Sugar Golf on Unsplash",
    description:
      "Oakmont Country Club — the meanest, most demanding test in American championship golf. " +
      "Founded in 1903 by Henry Fownes, this Pittsburgh-area monument to difficulty has hosted more combined USGA and " +
      "PGA championships than any other course in the country. The greens are faster than glass, the bunkers deeper " +
      "than memory, and the rough absolutely penal. The famous Church Pews bunker — a series of grass-topped ridges " +
      "stretching between the 3rd and 4th fairways — is just one of over 200 bunkers waiting to swallow errant shots. " +
      "Par is a genuine accomplishment here. When the U.S. Open comes to Oakmont, scoring soars and egos are humbled. " +
      "This is golf at its most unforgiving, where only the finest ball-strikers survive.",
  },
  "Aronimink Golf Club": {
    title: "Aronimink Golf Club",
    image: "https://images.unsplash.com/photo-1621295577182-ca399ea64523?w=1280&q=80",
    imageCredit: "Photo by Robert Ruggiero on Unsplash",
    description:
      "Aronimink Golf Club, a Donald Ross masterpiece nestled in the rolling hills of suburban Philadelphia. " +
      "Originally designed in 1928, this storied layout has stood the test of time, hosting major championships " +
      "across the decades. Ross himself called it his finest work — and when you walk these fairways, you understand why. " +
      "The course demands every shot in the bag. Elevated greens, framed by deep bunkers and crowned with Ross's " +
      "signature false fronts, reject anything less than pure ball-striking. The back nine builds to a crescendo — " +
      "a relentless stretch of par-4s where position off the tee is everything. This is old-school championship golf, " +
      "where the architecture does the talking and the cream always rises to the top.",
  },
  "Shinnecock Hills Golf Club": {
    title: "Shinnecock Hills Golf Club",
    image: "https://images.unsplash.com/photo-1633451095735-ce053fea943c?w=1280&q=80",
    imageCredit: "Photo by Cristina Anne Costello on Unsplash",
    description:
      "Shinnecock Hills — one of the five founding member clubs of the United States Golf Association, and arguably " +
      "the finest links-style course in America. Perched on the windswept bluffs of eastern Long Island, this layout " +
      "is raw, honest, and absolutely unforgiving. The wind off the Peconic Bay is the invisible opponent here — " +
      "it swirls, it gusts, it changes direction mid-swing. The fescue-lined fairways run fast and firm, and the " +
      "small, tilted greens demand a surgeon's touch. William Flynn's design is a study in strategic minimalism: " +
      "no tricks, no gimmicks, just pure golf architecture that asks one simple question — how good are you? " +
      "When the flags are flapping and the fairways are baked out, Shinnecock is as demanding a test as exists in golf.",
  },
  "Royal Portrush Golf Club": {
    title: "The Dunluce Links at Royal Portrush",
    image: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1280&q=80",
    imageCredit: "Photo by Unsplash",
    description:
      "Royal Portrush — the crown jewel of Irish golf, set against the dramatic backdrop of the North Atlantic coast. " +
      "The Dunluce Links is a breathtaking stretch of golfing terrain carved into the towering dunes and rugged " +
      "cliffs of County Antrim. The views are staggering — the white limestone cliffs of Whiterocks, the distant " +
      "outline of the Giant's Causeway, and on a clear day, the Scottish coast shimmering across the sea. " +
      "But make no mistake, this is not a sightseeing tour. The wind here is ferocious, the bounces unpredictable, " +
      "and the cavernous bunkers punishing. The par-5 7th, plunging downhill toward the sea, and the fearsome " +
      "Calamity Corner at 16 — a 236-yard par-3 over a yawning chasm — these are holes that separate the bold from " +
      "the merely talented. When The Open Championship comes to Portrush, the world watches in awe.",
  },
  "Royal Portrush": {
    title: "The Dunluce Links at Royal Portrush",
    image: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1280&q=80",
    imageCredit: "Photo by Unsplash",
    description:
      "Royal Portrush — the crown jewel of Irish golf, set against the dramatic backdrop of the North Atlantic coast. " +
      "The Dunluce Links is a breathtaking stretch of golfing terrain carved into the towering dunes and rugged " +
      "cliffs of County Antrim. The views are staggering — the white limestone cliffs of Whiterocks, the distant " +
      "outline of the Giant's Causeway, and on a clear day, the Scottish coast shimmering across the sea. " +
      "But make no mistake, this is not a sightseeing tour. The wind here is ferocious, the bounces unpredictable, " +
      "and the cavernous bunkers punishing. The par-5 7th, plunging downhill toward the sea, and the fearsome " +
      "Calamity Corner at 16 — a 236-yard par-3 over a yawning chasm — these are holes that separate the bold from " +
      "the merely talented. When The Open Championship comes to Portrush, the world watches in awe.",
  },
  "Royal Troon Golf Club": {
    title: "The Old Course at Royal Troon",
    image: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=1280&q=80",
    imageCredit: "Photo by Robert Ruggiero on Unsplash",
    description:
      "Royal Troon — where the Postage Stamp awaits, and legends are forged on the Ayrshire coast. " +
      "The Old Course at Royal Troon is a classic Open Championship venue, stretching along the Firth of Clyde " +
      "with views across to the Isle of Arran and Ailsa Craig. Founded in 1878, this storied links has hosted " +
      "The Open nine times, producing champions who conquered its unique challenge: a front nine that runs with " +
      "the prevailing wind, and a brutally difficult back nine directly into it. The 8th hole, the Postage Stamp, " +
      "is just 123 yards — the shortest hole in Open Championship golf — but its tiny, heavily bunkered green " +
      "has humbled the game's greatest players. When the wind howls off the sea and the pot bunkers lurk in shadow, " +
      "Royal Troon reveals itself as one of the sternest tests in links golf.",
  },
  "Royal Troon": {
    title: "The Old Course at Royal Troon",
    image: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1280&q=80",
    imageCredit: "Photo by Mick De Paola on Unsplash",
    description:
      "Royal Troon — where the Postage Stamp awaits, and legends are forged on the Ayrshire coast. " +
      "The Old Course at Royal Troon is a classic Open Championship venue, stretching along the Firth of Clyde " +
      "with views across to the Isle of Arran and Ailsa Craig. Founded in 1878, this storied links has hosted " +
      "The Open nine times, producing champions who conquered its unique challenge: a front nine that runs with " +
      "the prevailing wind, and a brutally difficult back nine directly into it. The 8th hole, the Postage Stamp, " +
      "is just 123 yards — the shortest hole in Open Championship golf — but its tiny, heavily bunkered green " +
      "has humbled the game's greatest players. When the wind howls off the sea and the pot bunkers lurk in shadow, " +
      "Royal Troon reveals itself as one of the sternest tests in links golf.",
  },
};

// Helper to find course info with flexible matching
function getCourseInfo(venue) {
  if (!venue) return null;
  // Direct match
  if (COURSE_INFO[venue]) return COURSE_INFO[venue];
  // Case-insensitive match
  const lowerVenue = venue.toLowerCase();
  for (const [key, value] of Object.entries(COURSE_INFO)) {
    if (key.toLowerCase() === lowerVenue) return value;
    // Partial match (e.g., "Royal Troon" matches "Royal Troon Golf Club")
    if (lowerVenue.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerVenue)) {
      return value;
    }
  }
  return null;
}

function formatDate(timestamp) {
  if (!timestamp) return "";
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Convert Wikimedia Commons file page URL to direct image URL
async function resolveImageUrl(url) {
  if (!url) return null;

  // If it's a Wikimedia Commons file page, fetch the actual image URL
  if (url.includes("commons.wikimedia.org/wiki/File:")) {
    try {
      const filename = url.split("File:")[1];
      if (filename) {
        const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&iiurlwidth=1280&format=json&origin=*`;
        const res = await fetch(apiUrl);
        const data = await res.json();
        const pages = data.query?.pages;
        const page = pages ? Object.values(pages)[0] : null;
        // Use thumburl for resized version, or url for original
        return page?.imageinfo?.[0]?.thumburl || page?.imageinfo?.[0]?.url || url;
      }
    } catch (err) {
      console.error("Error resolving Wikimedia URL:", err);
    }
  }

  return url;
}

export default function TournamentPage() {
  const { tournamentKey } = useParams();
  const [tournament, setTournament] = useState(null);
  const [resolvedImageUrl, setResolvedImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, "tournaments", tournamentKey));
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setTournament(data);

          // Resolve image URL (handles Wikimedia conversion)
          if (data.imageUrl) {
            const resolved = await resolveImageUrl(data.imageUrl);
            setResolvedImageUrl(resolved);
          }
        }
      } catch (err) {
        console.error("Error loading tournament:", err);
      }
      setLoading(false);
    }
    load();
  }, [tournamentKey]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-12 text-gray-400">
        Tournament not found.
      </div>
    );
  }

  const courseInfo = getCourseInfo(tournament.venue);
  // Use resolved image URL (handles Wikimedia conversion) or fall back to courseInfo
  const displayImage = resolvedImageUrl || courseInfo?.image;

  return (
    <div className="space-y-8">
      <div>
        <Link to="/" className="text-gold-400 text-sm hover:text-gold-300">
          &larr; Back to Standings
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white/10 rounded-lg p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-heading text-gold-500 uppercase">
              {tournament.name}
            </h1>
            <p className="text-gray-300 mt-1">{tournament.venue}</p>
            <p className="text-gray-400 text-sm">{tournament.location}</p>
            <p className="text-gray-400 text-sm mt-1">
              {formatDate(tournament.startDate)} &mdash;{" "}
              {formatDate(tournament.endDate)}
            </p>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded ${
              STATUS_COLORS[tournament.status] || "bg-gray-600"
            }`}
          >
            {STATUS_LABELS[tournament.status] || tournament.status}
          </span>
        </div>

        <div className="flex gap-3 mt-4">
          {(tournament.status === "field_set" ||
            tournament.status === "upcoming") && (
            <Link
              to={`/picks/${tournament.id}`}
              className="bg-gold-500 hover:bg-gold-600 text-white px-4 py-2 rounded text-sm font-heading uppercase"
            >
              Make Picks
            </Link>
          )}
          {tournament.status === "completed" && (
            <Link
              to={`/results/${tournament.id}`}
              className="bg-gold-500 hover:bg-gold-600 text-white px-4 py-2 rounded text-sm font-heading uppercase"
            >
              View Results
            </Link>
          )}
        </div>
      </div>

      {/* Course Image & Description */}
      {(courseInfo || displayImage) && (
        <div className="bg-white/10 rounded-lg overflow-hidden p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-heading text-gold-400 uppercase mb-3">
                {courseInfo?.title || tournament.venue}
              </h2>
              {courseInfo?.description && (
                <p className="text-gray-300 leading-relaxed text-sm">
                  {courseInfo.description}
                </p>
              )}
            </div>
            {displayImage && (
              <div className="sm:w-1/3 flex-shrink-0">
                <div className="relative">
                  <img
                    src={displayImage}
                    alt={courseInfo?.title || tournament.venue}
                    className="w-full h-48 sm:h-full object-cover rounded"
                  />
                  {!tournament.imageUrl && courseInfo?.imageCredit && (
                    <p className="absolute bottom-0 right-0 bg-black/60 text-gray-400 text-xs px-2 py-1 rounded-tl">
                      {courseInfo.imageCredit}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weather */}
      <div className="bg-white/10 rounded-lg p-6">
        <WeatherForecast
          coordinates={tournament.coordinates}
          location={tournament.location}
        />
      </div>
    </div>
  );
}
