# Testing Guide

This guide explains how to test the StashDB Stremio Addon.

## Configuration Overview

The addon uses **two separate configurations**:

1. **Server Config (`.env`)**: For scraping trending scenes
   - Easynews username/password
   - StashDB API key
   - Used server-side only

2. **User Config (URL)**: For streaming videos
   - Easynews username/password per user
   - Passed via base64-encoded install URL
   - Used client-side for generating stream URLs

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Server Credentials

Create a `.env` file in the project root:

```bash
EASYNEWS_USERNAME=your-server-easynews-username
EASYNEWS_PASSWORD=your-server-easynews-password
STASHDB_API_KEY=your-stashdb-api-key
SCRAPE_COUNT=100
PORT=7001
```

See `.env.example` for reference.

### 3. Start the Server

```bash
npm start
```

You should see:
```
✅ Environment configuration loaded
Starting scraper...

=== Starting scrape ===
Time: 2025-11-08T12:00:00.000Z
Found 50 trending scenes from StashDB
...

🚀 Addon running at http://localhost:7000/manifest.json

📦 Install in Stremio with user config:
   http://localhost:7000/<user-config-base64>/manifest.json

   User config format: {"easynewsUsername":"user","easynewsPassword":"pass"}
   (StashDB API key not needed in user config - only for scraping)
```

## Testing Endpoints

### 1. Manifest
```bash
curl http://localhost:7001/manifest.json
```

### 2. Catalog
```bash
curl http://localhost:7001/catalog/movie/stashdb-trending.json
```

### 3. Meta (replace `<scene-id>` with actual ID)
```bash
curl http://localhost:7001/meta/movie/<scene-id>.json
```

### 4. Streams (replace with actual values)
```bash
# Create user config
USER_CONFIG=$(echo -n '{"easynewsUsername":"testuser","easynewsPassword":"testpass"}' | base64)

# Test stream endpoint
curl "http://localhost:7001/${USER_CONFIG}/stream/movie/<scene-id>.json"
```

## Installing in Stremio

### Method 1: Using Stremio's Configuration Form (Recommended)

1. **Open Stremio** and go to Settings → Addons
2. **Add the addon URL**: `http://localhost:7001/manifest.json`
3. **Click "Install"** - Stremio will show a configuration page
4. **Enter your Easynews credentials** in the form
5. **Click "Install Addon"**

### Method 2: Manual Install URL (For Testing)

1. **Create user config**:
```json
{
  "easynewsUsername": "user123",
  "easynewsPassword": "pass456"
}
```

2. **Encode to base64**:
```bash
echo -n '{"easynewsUsername":"user123","easynewsPassword":"pass456"}' | base64
```

3. **Install in Stremio with full URL**:
```
http://localhost:7001/eyJlYXN5bmV3c1VzZXJuYW1lIjoidXNlcjEyMyIsImVhc3luZXdzUGFzc3dvcmQiOiJwYXNzNDU2In0=/manifest.json
```

## Testing Checklist

**Server Setup:**
- [ ] `.env` file created with valid credentials
- [ ] `npm install` completes successfully
- [ ] `npm start` runs without errors
- [ ] Scraper fetches trending scenes
- [ ] Scenes are cached (check console output)

**API Endpoints:**
- [ ] Manifest endpoint returns valid JSON
- [ ] Catalog endpoint returns list of scenes
- [ ] Meta endpoint returns scene details
- [ ] Stream endpoint with user config returns stream URLs

**Stremio Integration:**
- [ ] Addon can be installed via base URL (shows config page)
- [ ] Configuration form displays correctly
- [ ] Addon installs with user credentials
- [ ] Scenes appear in Stremio catalog
- [ ] Scene details display correctly
- [ ] Videos play with user's Easynews credentials
- [ ] Can also install with manual config URL (for advanced users)

**Security:**
- [ ] Server `.env` credentials not exposed in responses
- [ ] User credentials extracted from URL path correctly
- [ ] Stream URLs include user's credentials (not server's)
- [ ] Credentials not cached (generated per-request)

## Troubleshooting

### "Missing required environment variables"
- Check `.env` file exists in project root
- Verify all three variables are set: `EASYNEWS_USERNAME`, `EASYNEWS_PASSWORD`, `STASHDB_API_KEY`

### "No user config provided for stream request"
- User must install addon with config URL
- Check base64 encoding is correct
- Verify JSON format: `{"easynewsUsername":"...","easynewsPassword":"..."}`

### "No scenes to process" or empty cache
- Check StashDB API key is valid
- Verify StashDB is accessible
- Check console for specific errors

### "No results found" for many scenes
- Server Easynews credentials might be invalid
- Scene dates/studio names might not match Easynews content
- This is normal - not all scenes will be available

### Videos won't play in Stremio
- Check user's Easynews credentials (not server's)
- Verify Easynews account is active
- Try accessing a stream URL directly in browser

### Port already in use
```bash
PORT=8000 npm start
```

## Beamup Deployment

### Setup on Beamup

1. **Push code to GitHub**

2. **Connect to Beamup:**
   - Go to [Beamup](https://www.beamup.dev/)
   - Create new addon
   - Connect your GitHub repository

3. **Set environment variables:**
   - `EASYNEWS_USERNAME` - Server credentials for scraping
   - `EASYNEWS_PASSWORD` - Server credentials for scraping
   - `STASHDB_API_KEY` - StashDB API key
   - `SCRAPE_COUNT` - Number of scenes to scrape (optional, defaults to 100)
   - (`PORT` is automatically set by Beamup)

4. **Deploy:**
   - Beamup will run `npm start`
   - Check logs to verify scraping works

5. **Share with users:**
   - Give users the base install URL: `https://your-addon.beamup.dev/manifest.json`
   - Stremio will prompt them to configure their Easynews credentials
   - Users enter credentials in Stremio's built-in configuration form

## Advanced Testing

### Test Different User Configs

Create multiple user configs to verify per-user credentials work:

**User 1:**
```bash
USER1_CONFIG=$(echo -n '{"easynewsUsername":"user1","easynewsPassword":"pass1"}' | base64)
echo "Install URL: http://localhost:7001/${USER1_CONFIG}/manifest.json"
```

**User 2:**
```bash
USER2_CONFIG=$(echo -n '{"easynewsUsername":"user2","easynewsPassword":"pass2"}' | base64)
echo "Install URL: http://localhost:7001/${USER2_CONFIG}/manifest.json"
```

Each user should get streams with their own credentials embedded.

### Verify Credential Separation

1. Start server with `.env` credentials
2. Install addon with different user credentials
3. Check stream URLs contain user credentials (not server's)
4. Verify scraping uses server credentials (check console logs)

## Production Deployment

For production:
1. Set environment variables on server (not `.env` file)
2. Use HTTPS for addon URL
3. Consider rate limiting for scraping
4. Monitor cache size and memory usage
5. Set up log rotation for console output
