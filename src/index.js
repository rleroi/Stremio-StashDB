require('dotenv').config();
const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const { parseConfig } = require('./config');
const { startScraper } = require('./services/scraper');
const catalogHandler = require('./handlers/catalog');
const metaHandler = require('./handlers/meta');
const streamHandler = require('./handlers/stream');

// Define the addon manifest
const manifest = {
  id: 'com.stremio.stashdb',
  version: '1.0.0',
  name: 'StashDB - Easynews',
  description: 'Stream trending scenes from StashDB via Easynews',
  resources: ['catalog', 'meta', 'stream'],
  types: ['movie'],
  idPrefixes: ['stashdb:'],
  catalogs: [
    {
      type: 'movie',
      id: 'stashdb-trending',
      name: 'StashDB',
      extra: [
        {
          name: 'genre',
          isRequired: false,
          options: ['Trending']
        }
      ]
    }
  ],
  behaviorHints: {
    configurable: true,
    configurationRequired: false
  },
  config: [
    {
      key: 'easynewsUsername',
      type: 'text',
      title: 'Easynews Username',
      required: true
    },
    {
      key: 'easynewsPassword',
      type: 'password',
      title: 'Easynews Password',
      required: true
    }
  ]
};

// Create addon builder with config parser
const builder = new addonBuilder(manifest);

/**
 * Define catalog handler
 */
builder.defineCatalogHandler((args) => {
  if (args.type === 'movie' && args.id === 'stashdb-trending') {
    return catalogHandler(args);
  }
  return Promise.resolve({ metas: [] });
});

/**
 * Define meta handler
 */
builder.defineMetaHandler((args) => {
  if (args.type === 'movie') {
    return metaHandler(args);
  }
  return Promise.resolve({ meta: null });
});

/**
 * Define stream handler
 * Config is extracted from args.config (provided by Stremio)
 */
builder.defineStreamHandler((args) => {
  if (args.type === 'movie') {
    // Parse user config (handles both object and base64 string)
    const userConfig = parseConfig(args.config);
    return streamHandler(args, userConfig);
  }
  return Promise.resolve({ streams: [] });
});

/**
 * Initialize and start the addon
 */
function startAddon() {
  try {
    // Validate environment variables for scraping
    if (!process.env.EASYNEWS_USERNAME || !process.env.EASYNEWS_PASSWORD || !process.env.STASHDB_API_KEY) {
      console.error('❌ Missing required environment variables!');
      console.error('Required: EASYNEWS_USERNAME, EASYNEWS_PASSWORD, STASHDB_API_KEY');
      console.error('Create a .env file (see .env.example)');
      process.exit(1);
    }

    console.log('✅ Environment configuration loaded');

    // Start the scraper (runs immediately and every 24h)
    // Uses environment variables for credentials
    startScraper();

    // Start HTTP server
    const port = process.env.PORT || 7001;
    serveHTTP(builder.getInterface(), { port }).then(({ server }) => {
      console.log(`\n📦 Install in Stremio:`);
      console.log(`   1. Open Stremio → Settings → Addons`);
      console.log(`   2. Paste: http://localhost:${port}/manifest.json`);
      console.log(`   3. Click "Install" (browse only) or "Configure" (for streaming)`);
      console.log(`\n   💡 Tip: Users can browse without config, but need Easynews`);
      console.log(`      credentials to stream videos.\n`);
    }).catch(err => {
      console.error('Failed to start HTTP server:', err);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start addon:', error.message);
    process.exit(1);
  }
}

// Start the addon
startAddon();

module.exports = builder;

