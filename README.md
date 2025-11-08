# StashDB Stremio Addon

A Stremio addon that streams trending scenes from StashDB via Easynews.

## Features

- 🔥 Fetches trending scenes from StashDB
- 🎬 Streams via Easynews
- 🔄 Automatic scraping every 24 hours
- 💾 In-memory caching (no database required)
- 🔐 Per-user streaming credentials

## Requirements

- Node.js 14+
- **For server (scraping):** Easynews account + StashDB API key
- **For users (streaming):** Easynews account

## Installation

### Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Configure server credentials:**

Create a `.env` file in the project root (see `.env.example`):
```bash
EASYNEWS_USERNAME=your-username
EASYNEWS_PASSWORD=your-password
STASHDB_API_KEY=your-api-key
SCRAPE_COUNT=100
PORT=7001
```

These credentials are used for **scraping only** (fetching trending scenes and metadata). `SCRAPE_COUNT` controls how many trending scenes to fetch (defaults to 100).

3. **Start the server:**
```bash
npm start
```

The addon will:
- Start the HTTP server on port 7001 (or `PORT` env variable)
- Begin scraping trending scenes from StashDB
- Update the cache every 24 hours

### Production (Beamup)

1. **Deploy to Beamup** (runs `npm start` automatically)

2. **Set environment variables** in Beamup dashboard:
   - `EASYNEWS_USERNAME` - Server Easynews username for scraping
   - `EASYNEWS_PASSWORD` - Server Easynews password for scraping
   - `STASHDB_API_KEY` - StashDB API key for fetching scenes
   - `PORT` - Automatically set by Beamup

3. **Done!** Beamup will handle the rest.

## Install in Stremio (Per User)

### Quick Install (Browse Only)

You can install the addon to browse the catalog and view metadata **without configuration**:

1. **Open Stremio** and go to Settings → Addons
2. **Add the addon URL:**
   - Local: `http://localhost:7001/manifest.json`
   - Production: `https://your-addon.beamup.dev/manifest.json`
3. **Click "Install"** to browse scenes

**Note:** To actually stream videos, you need to configure your Easynews credentials.

### Full Install with Streaming (Recommended)

To stream videos, configure your **own Easynews credentials**:

1. **Open Stremio** and go to Settings → Addons
2. **Add the addon URL** (same as above)
3. **Click "Configure"** instead of "Install"
4. **Enter your Easynews credentials:**
   - Easynews Username
   - Easynews Password
5. **Click "Install Addon"** to complete the setup

### Option 2: Manual Install URL (Advanced)

If you prefer to create the install URL manually:

1. Create user config JSON:
```json
{
  "easynewsUsername": "your-username",
  "easynewsPassword": "your-password"
}
```

2. Base64 encode it:
```bash
echo -n '{"easynewsUsername":"user123","easynewsPassword":"pass456"}' | base64
```

3. Install in Stremio with the full URL:
```
# Local
http://localhost:7001/eyJlYXN5bmV3c1VzZXJuYW1lIjoidXNlcjEyMyIsImVhc3luZXdzUGFzc3dvcmQiOiJwYXNzNDU2In0=/manifest.json

# Production
https://your-addon.beamup.dev/eyJlYXN5bmV3c1VzZXJuYW1lIjoidXNlcjEyMyIsImVhc3luZXdzUGFzc3dvcmQiOiJwYXNzNDU2In0=/manifest.json
```

## How It Works

### Server-Side (Scraping)

On startup and every 24 hours, the server:
1. Fetches trending scenes from StashDB (using `.env` credentials)
2. Searches Easynews for each scene using studio name and date
3. Filters results by date order validation
4. Sorts by resolution (highest first)
5. Caches scenes with available streams

### Client-Side (Streaming)

When a user plays a video:
1. Retrieves scene from cache
2. Generates stream URLs with **user's Easynews credentials** from install URL
3. Returns available streams sorted by quality

**Important:** 
- Scraping uses server credentials (`.env`)
- Streaming uses per-user credentials (install URL)
- Credentials are NEVER cached, generated fresh per-request

## Architecture

```
src/
├── index.js              # Main entry point (HTTP server + scraper)
├── config.js             # Configuration parser
├── cache.js              # In-memory cache
├── services/
│   ├── stashdb.js       # StashDB GraphQL client
│   ├── easynews.js      # Easynews API client
│   └── scraper.js       # Scraping logic with scheduler
└── handlers/
    ├── catalog.js       # Catalog handler
    ├── meta.js          # Meta handler
    └── stream.js        # Stream handler
```

## Security

- ✅ Server credentials stored in `.env` (never exposed to clients)
- ✅ User credentials passed via base64-encoded URL (per-user)
- ✅ Stream URLs with credentials generated per-request (never cached)
- ✅ Separation of concerns: scraping vs streaming credentials

## Development

The addon uses a single entry point (`npm start`) that:
- Loads server configuration from environment variables (`.env` for local, Beamup env vars for production)
- Starts the HTTP server on `PORT` (set by Beamup or defaults to 7000)
- Runs initial scrape on boot using server credentials
- Schedules recurring scrapes every 24 hours
- Handles per-user streaming with credentials from install URL

## Deployment

This addon is designed to be deployed on [Beamup](https://www.beamup.dev/):

1. Push to GitHub
2. Connect to Beamup
3. Set environment variables (see `.env.example`)
4. Deploy - Beamup runs `npm start` automatically
5. Share install URL with users: `https://your-addon.beamup.dev/manifest.json`
   - Users will be prompted to configure their Easynews credentials
   - Stremio's built-in configuration form will handle credential input

## License

ISC

