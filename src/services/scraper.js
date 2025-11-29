const stashdb = require('./stashdb');
const easynews = require('./easynews');
const cache = require('../cache');

/**
 * Check if date components appear in the correct order in the string
 */
function validateDateOrder(str, yy, mm, dd) {
  const yyIndex = str.indexOf(yy);
  const mmIndex = str.indexOf(mm);
  const ddIndex = str.indexOf(dd);

  // All components must be present and in correct order
  return yyIndex !== -1 && mmIndex !== -1 && ddIndex !== -1 &&
         yyIndex < mmIndex && mmIndex < ddIndex;
}

/**
 * Filter Easynews results based on date order and optional duration
 */
function filterResults(dataItems, yy, mm, dd, expectedDuration = null) {
  return dataItems.filter(item => {
    const postTitle = item['10'] || '';
    
    // Check date order
    if (!validateDateOrder(postTitle, yy, mm, dd)) {
      return false;
    }

    // If duration is provided, check duration match (within 5 seconds tolerance)
    if (expectedDuration) {
      const actualDuration = easynews.getDuration(item);
      
      if (actualDuration && Math.abs(actualDuration - expectedDuration) > 5) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort results by resolution (highest first)
 */
function sortByResolution(dataItems) {
  return dataItems.sort((a, b) => {
    const resA = easynews.getResolution(a);
    const resB = easynews.getResolution(b);
    return resB - resA; // Descending order
  });
}

/**
 * Process a single scene: search Easynews and cache if found
 */
async function processScene(scene, config) {
  const searchQuery = stashdb.buildSearchQuery(scene);
  
  if (!searchQuery) {
    console.log(`Skipping scene ${scene.id}: No valid search query`);
    return false;
  }

  console.log(`Searching for: ${scene.title} (query: ${searchQuery})`);

  const searchResponse = await easynews.search(
    config.easynewsUsername,
    config.easynewsPassword,
    searchQuery
  );

  if (!searchResponse || !searchResponse.data || searchResponse.data.length === 0) {
    console.log(`No results found for: ${scene.title}`);
    return false;
  }

  // Get date info for filtering
  const dateInfo = stashdb.formatDateForQuery(scene.date || scene.release_date);
  
  // Filter results by date order
  let filteredResults = filterResults(
    searchResponse.data,
    dateInfo.yy,
    dateInfo.mm,
    dateInfo.dd,
    scene.duration
  );

  if (filteredResults.length === 0) {
    console.log(`No matching results after filtering for: ${scene.title}`);
    return false;
  }

  // Sort by resolution
  filteredResults = sortByResolution(filteredResults);

  // Build URLs (without credentials)
  const urlPrefix = easynews.getUrlPrefix(searchResponse);
  const results = filteredResults.map(item => ({
    url: easynews.buildUrl(urlPrefix, item),
    filename: item['10'] || item.fn, // Filename
    resolution: easynews.getResolution(item),
    codec: easynews.getCodec(item),
    size: item.size || item.rawSize, // File size in bytes
    sizeFormatted: easynews.formatSize(item['4'] || item.size || item.rawSize), // Use formatted string or bytes
    duration: easynews.getDuration(item) // Duration in seconds
  }));

  // Cache the scene with results
  cache.set(scene.id, {
    ...scene,
    easynewsResults: results
  });

  console.log(`Cached ${results.length} results for: ${scene.title}`);
  return true;
}

/**
 * Scrape trending scenes and cache them
 * Uses environment variables for credentials
 */
async function scrape() {
  console.log('\n=== Starting scrape ===');
  console.log(`Time: ${new Date().toISOString()}`);

  try {
    // Get credentials from environment
    const easynewsUsername = process.env.EASYNEWS_USERNAME;
    const easynewsPassword = process.env.EASYNEWS_PASSWORD;
    const stashdbApiKey = process.env.STASHDB_API_KEY;

    if (!easynewsUsername || !easynewsPassword || !stashdbApiKey) {
      console.error('Missing required environment variables for scraping');
      return;
    }

    const config = { easynewsUsername, easynewsPassword, stashdbApiKey };

    // Clear cache before starting new scrape to replace old data
    cache.clear();
    console.log('Cache cleared');

    // Fetch trending scenes from StashDB
    const targetCount = parseInt(process.env.SCRAPE_COUNT || '100', 10);
    const scenes = await stashdb.getTrendingScenes(config.stashdbApiKey, targetCount);
    console.log(`Found ${scenes.length} trending scenes from StashDB`);

    if (scenes.length === 0) {
      console.log('No scenes to process');
      return;
    }

    // Process each scene
    let successCount = 0;
    for (const scene of scenes) {
      const success = await processScene(scene, config);
      if (success) successCount++;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\nScrape complete: ${successCount}/${scenes.length} scenes cached`);
    console.log(`Cache size: ${cache.size()} scenes`);
  } catch (error) {
    console.error('Scrape error:', error);
  }

  console.log('=== Scrape finished ===\n');
}

/**
 * Start the scraper with initial scrape and 24h interval
 * Uses environment variables for credentials
 */
function startScraper() {
  console.log('Starting scraper...');
  
  // Run initial scrape
  scrape();

  // Schedule scraping every 24 hours (86400000 ms)
  const interval = setInterval(() => {
    scrape();
  }, 24 * 60 * 60 * 1000);

  return interval;
}

module.exports = {
  scrape,
  startScraper,
  validateDateOrder,
  filterResults,
  sortByResolution,
  processScene
};

