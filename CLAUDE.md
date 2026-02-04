# RDM Golf Pool

A golf pool web app for a group of friends to make picks on major tournaments and track standings throughout the season.

## Tech Stack

- **Frontend**: React 18, React Router, Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Cloud Functions, Hosting)
- **APIs**: ESPN (golf data), NWS/Open-Meteo (weather)

## Project Structure

```
src/
├── App.js              # Main app, routing, auth UI, mobile nav
├── firebase.js         # Firebase config and auth helpers
├── contexts/
│   └── AuthContext.js  # Auth state provider
├── pages/
│   ├── HomePage.js     # Standings table, tournament cards, pick reminders
│   ├── PicksPage.js    # Make picks for a tournament
│   ├── ResultsPage.js  # Tournament results with R1-R4 scores
│   ├── TournamentPage.js # Course description, weather, tournament details
│   ├── TournamentsPage.js # All tournaments list
│   └── AdminPage.js    # Admin panel (users, tournaments, import data)
├── components/
│   └── WeatherForecast.js # NWS for US venues, Open-Meteo for international
└── utils/
    └── notifications.js # Browser notification helpers

functions/
├── index.js            # Cloud Functions (importField, importResults, createParticipant, etc.)
├── seed-2026.js        # One-time script to seed 2026 tournaments
└── update-coordinates.js # One-time script to add coordinates to tournaments

public/
├── manifest.json       # PWA manifest
└── sw.js              # Service worker for offline/notifications
```

## Key Firestore Collections

- `users` - User profiles (displayName, email, isAdmin)
- `tournaments` - Tournament config (name, venue, dates, status, coordinates, espnId, imageUrl)
- `fields/{tournamentKey}` - Golfer list for each tournament (imported from ESPN)
- `picks` - User picks (userId, tournamentKey, year, golfers array)
- `results/{tournamentKey}` - Tournament results (imported from ESPN)
- `standings/{year}` - Calculated standings with breakdown by tournament

## Tournament Statuses

- `upcoming` - Tournament announced but field not set
- `field_set` - Field imported, picks open
- `active` - Tournament in progress (picks locked)
- `completed` - Results imported

## Deployment

```bash
npm run build && firebase deploy
```

Or deploy just hosting: `firebase deploy --only hosting`
Or deploy just functions: `firebase deploy --only functions`

## Admin Workflows

### Adding a Tournament
1. Admin Panel → Tournaments tab → fill form → Create
2. Add coordinates (lat/lon) for weather
3. Optionally add imageUrl (Wikimedia Commons or direct image URL)

### Importing a Field (when field is announced)
1. Find ESPN tournament page, get the event ID from URL
2. Admin Panel → set espnId on tournament → Import Field
3. Tournament status changes to `field_set`, picks open

### Importing Results (after tournament ends)
1. Admin Panel → Import Results for the tournament
2. Results page shows leaderboard with R1-R4 scores
3. Run "Calculate Standings" to update season standings

### Creating User Accounts
1. Admin Panel → Users tab → Add Participant form
2. Enter email and display name
3. Get password reset link → send to participant
4. They set password and can log in

## Course Images

Tournament images can come from:
1. **Admin-set imageUrl** - Paste URL in admin panel
2. **Fallback** - Built-in COURSE_INFO in TournamentPage.js

For Wikimedia Commons: paste the file page URL (e.g., `https://commons.wikimedia.org/wiki/File:Augusta_National.jpg`) and the app automatically resolves it to a direct image URL via their API.

## Weather

- **US venues**: NWS API (free, no key needed)
- **International venues**: Open-Meteo API (free, no key needed)
- Requires `coordinates: { lat, lon }` on tournament doc

## Auth

- Google OAuth (primary)
- Email/password (for participants without Google accounts)
- Admin creates accounts and sends password reset links

## PWA Features

- Installable on mobile (Add to Home Screen)
- Service worker for caching
- Browser notifications for pick reminders (24-hour warning)

## Notes

- ESPN event IDs change each year — update them when ESPN publishes tournament pages
- Picks lock at tournament start time (based on startDate)
- The seed scripts in `functions/` are one-time use — run with `node seed-2026.js` from the functions directory after `npm install`
- Standings calculation runs manually from admin panel after importing results
