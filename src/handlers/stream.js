const cache = require('../cache');
const easynews = require('../services/easynews');

/**
 * Stream handler - returns stream objects with URLs that include credentials
 * IMPORTANT: Credentials are added per-request from user config, never cached
 * User must provide their Easynews credentials in the install URL
 */
function streamHandler(args, userConfig) {
  const { id } = args;
  
  // Strip the stashdb: prefix to get the actual scene ID
  const sceneId = id.replace('stashdb:', '');
  const scene = cache.get(sceneId);
  
  if (!scene || !scene.easynewsResults || scene.easynewsResults.length === 0) {
    return Promise.resolve({ streams: [] });
  }

  // Check if user config is provided
  if (!userConfig || !userConfig.easynewsUsername || !userConfig.easynewsPassword) {
    console.error('No user config provided for stream request');
    return Promise.resolve({ 
      streams: [{
        name: 'Configuration Required',
        title: 'Please reinstall addon with your Easynews credentials',
        url: ''
      }]
    });
  }

  // Build stream objects with user's credentials
  const streams = scene.easynewsResults.map((result, index) => {
    // Add user's credentials to URL for this specific request
    const streamUrl = easynews.getStreamUrl(
      userConfig.easynewsUsername,
      userConfig.easynewsPassword,
      result.url
    );

    // Build title with multiple lines
    const titleParts = [];
    
    // Line 1: 📺 Resolution
    if (result.resolution) {
      titleParts.push(`📺 ${result.resolution}p`);
    } else {
      titleParts.push(`📺 Unknown Quality`);
    }
    
    // Line 2: ⚙️ Codec + Size
    const line2Parts = [];
    if (result.codec) line2Parts.push(result.codec);
    if (result.sizeFormatted) line2Parts.push(result.sizeFormatted);
    if (line2Parts.length > 0) {
      titleParts.push(`⚙️ ${line2Parts.join(' • ')}`);
    }
    
    // Line 3: 📁 Filename (truncated)
    if (result.filename) {
      let filename = result.filename;
      if (filename.length > 50) {
        filename = filename.substring(0, 47) + '...';
      }
      titleParts.push(`📁 ${filename}`);
    }

    return {
      name: 'Easynews',
      title: titleParts.join('\n'),
      url: streamUrl
    };
  });

  return Promise.resolve({ streams });
}

module.exports = streamHandler;

