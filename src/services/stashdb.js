const axios = require('axios');

const STASHDB_URL = 'https://stashdb.org/graphql';

const TRENDING_SCENES_QUERY = `
  query QueryScenes($page: Int!) {
    queryScenes(input: { page: $page, per_page: 25, sort: TRENDING }) {
      scenes {
        id
        title
        details
        date
        release_date
        production_date
        duration
        director
        code
        created
        updated
        studio {
          id
          name
          aliases
        }
        tags {
          name
          id
        }
        images {
          url
          width
          height
        }
      }
      count
    }
  }
`;

/**
 * Query trending scenes from StashDB
 * Fetches multiple pages to get ~100 results
 */
async function getTrendingScenes(apiKey, targetCount = 100) {
  const allScenes = [];
  const perPage = 25;
  const maxPages = Math.ceil(targetCount / perPage);

  try {
    for (let page = 1; page <= maxPages; page++) {
      const response = await axios.post(
        STASHDB_URL,
        {
          query: TRENDING_SCENES_QUERY,
          variables: { page }
        },
        {
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.errors) {
        console.error('StashDB GraphQL errors:', response.data.errors);
        break;
      }

      const scenes = response.data.data.queryScenes.scenes || [];
      allScenes.push(...scenes);

      console.log(`  Fetched page ${page}: ${scenes.length} scenes`);

      // Stop if we got fewer scenes than expected (last page)
      if (scenes.length < perPage) {
        break;
      }

      // Small delay between pages
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return allScenes;
  } catch (error) {
    console.error('StashDB API error:', error.message);
    return allScenes; // Return what we have so far
  }
}

/**
 * Format date as YY.MM.DD for Easynews query
 */
function formatDateForQuery(dateString) {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  const yy = date.getFullYear().toString().slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  
  return { yy, mm, dd };
}

/**
 * Format studio name for Easynews query (alphanumeric only)
 */
function formatStudioName(studioName) {
  if (!studioName) return null;
  // Remove non-alphanumeric characters and spaces
  return studioName.replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Build Easynews search query from scene
 */
function buildSearchQuery(scene) {
  const dateInfo = formatDateForQuery(scene.date || scene.release_date);
  if (!dateInfo) return null;

  const studioName = formatStudioName(scene.studio?.name);
  if (!studioName) return null;

  return `${studioName}.${dateInfo.yy}.${dateInfo.mm}.${dateInfo.dd}`;
}

module.exports = {
  getTrendingScenes,
  formatDateForQuery,
  formatStudioName,
  buildSearchQuery
};

