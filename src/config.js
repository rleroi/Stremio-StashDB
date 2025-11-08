/**
 * Parse user configuration
 * Config can come as:
 * 1. Object (from Stremio's built-in config form - already parsed)
 * 2. URL-encoded JSON string (from Stremio's config form in URL)
 * 3. Base64-encoded JSON string (from manual install URL)
 */

function parseConfig(config) {
  // If config is not provided or invalid type, return null
  if (!config) {
    return null;
  }

  try {
    let parsedConfig;

    // Handle object config (from Stremio's config form - already parsed)
    if (typeof config === 'object' && !Buffer.isBuffer(config)) {
      parsedConfig = config;
    }
    // Handle string config (URL-encoded or base64)
    else if (typeof config === 'string') {
      // Try URL-decoding first (from Stremio's config form in URL)
      try {
        const urlDecoded = decodeURIComponent(config);
        parsedConfig = JSON.parse(urlDecoded);
      } catch (e) {
        // If URL-decoding fails, try base64 (from manual install URL)
        try {
          const base64Decoded = Buffer.from(config, 'base64').toString('utf-8');
          parsedConfig = JSON.parse(base64Decoded);
        } catch (e2) {
          return null;
        }
      }
    }
    // Invalid type
    else {
      return null;
    }

    // Validate required fields for streaming (Easynews credentials)
    if (!parsedConfig.easynewsUsername || !parsedConfig.easynewsPassword) {
      return null;
    }

    return {
      easynewsUsername: parsedConfig.easynewsUsername,
      easynewsPassword: parsedConfig.easynewsPassword
    };
  } catch (error) {
    // Silently return null for invalid configs
    return null;
  }
}

module.exports = { parseConfig };

