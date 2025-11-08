const cache = require('../cache');

/**
 * Meta handler - returns full meta object for a specific scene
 */
function metaHandler(args) {
  const { id } = args;
  
  // Strip the stashdb: prefix to get the actual scene ID
  const sceneId = id.replace('stashdb:', '');
  const scene = cache.get(sceneId);
  
  if (!scene) {
    return Promise.resolve({ meta: null });
  }

  // Find landscape poster and background images
  let poster = null;
  let background = null;
  
  if (scene.images && scene.images.length > 0) {
    // Prefer landscape images for poster
    const landscapeImage = scene.images.find(img => 
      img.url && img.width && img.height && img.width > img.height
    );
    poster = landscapeImage?.url || scene.images[0]?.url || null;
    
    // Use another landscape image for background if available
    const backgroundImage = scene.images.find(img => 
      img.url && img.url !== poster && img.width && img.height && img.width > img.height
    );
    background = backgroundImage?.url || poster;
  }

  // Extract genres from tags
  const genres = scene.tags?.map(tag => tag.name) || [];

  // Format runtime (convert seconds to minutes if needed)
  const runtime = scene.duration 
    ? `${Math.floor(scene.duration / 60)} min`
    : null;

  const meta = {
    id: `stashdb:${scene.id}`,
    type: 'movie',
    name: scene.title,
    poster: poster,
    posterShape: 'landscape',
    background: background,
    description: scene.details,
    releaseInfo: scene.date || scene.release_date || null,
    director: scene.director ? [scene.director] : [],
    cast: [], // Could be extended with performer data if needed
    genres: genres,
    runtime: runtime,
    // Additional metadata
    links: [
      {
        name: 'StashDB',
        category: 'imdb',
        url: `https://stashdb.org/scenes/${scene.id}`
      }
    ]
  };

  return Promise.resolve({ meta });
}

module.exports = metaHandler;

