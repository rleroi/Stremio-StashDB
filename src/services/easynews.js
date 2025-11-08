const axios = require('axios');

/**
 * Search Easynews for videos
 */
async function search(username, password, query) {
  try {
    const response = await axios.get(
      'https://members.easynews.com/2.0/search/solr-search/advanced',
      {
        params: {
          gps: query,
          u: 1,
          'fty[]': 'VIDEO',
          fex: 'm4v,3gp,mov,divx,xvid,wmv,avi,mpg,mpeg,mp4,mkv,avc,flv,webm'
        },
        auth: {
          username,
          password
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Easynews search error for query "${query}":`, error.message);
    return null;
  }
}

/**
 * Get URL prefix from search response
 */
function getUrlPrefix(searchResponse) {
  const downUrl = searchResponse.downURL || '';
  const dlFarm = searchResponse.dlFarm || '';
  const dlPort = searchResponse.dlPort || '';

  return `${downUrl}/${dlFarm}/${dlPort}`;
}

/**
 * Build URL from data item (without credentials)
 */
function buildUrl(urlPrefix, dataItem) {
  const postHash = dataItem['0'] || '';
  const postTitle = dataItem['10'] || '';
  const ext = dataItem['11'] || '';

  return `${urlPrefix}/${postHash}${ext}/${postTitle}${ext}`;
}

/**
 * Get stream URL with credentials embedded
 * IMPORTANT: This should only be called per-request, never cache the result
 */
function getStreamUrl(username, password, url) {
  const urlWithoutProtocol = url.replace('https://', '');
  return `https://${username}:${password}@${urlWithoutProtocol}`;
}

/**
 * Parse duration from Easynews format (e.g., "40m:23s" -> 2423 seconds)
 */
function parseDuration(durationString) {
  if (!durationString || typeof durationString !== 'string') {
    return null;
  }

  const match = durationString.match(/(?:(\d+)m)?:?(?:(\d+)s)?/);
  if (!match) return null;

  const minutes = parseInt(match[1] || 0, 10);
  const seconds = parseInt(match[2] || 0, 10);
  
  return minutes * 60 + seconds;
}

/**
 * Get duration in seconds from data item
 */
function getDuration(dataItem) {
  // Try runtime field (in seconds)
  if (dataItem.runtime) {
    return parseInt(dataItem.runtime, 10);
  }
  
  // Try duration string field (e.g., "30m:30s")
  if (dataItem['14']) {
    return parseDuration(dataItem['14']);
  }
  
  return null;
}

/**
 * Extract resolution from various fields
 */
function getResolution(dataItem) {
  // Try yres field (most reliable)
  if (dataItem.yres) {
    const h = parseInt(dataItem.yres, 10);
    if (h >= 2160) return 2160;
    if (h >= 1080) return 1080;
    if (h >= 720) return 720;
    if (h >= 480) return 480;
    return h;
  }
  
  // Try height field
  if (dataItem.height && !isNaN(dataItem.height)) {
    const h = parseInt(dataItem.height, 10);
    if (h >= 2160) return 2160;
    if (h >= 1080) return 1080;
    if (h >= 720) return 720;
    if (h >= 480) return 480;
    return h;
  }
  
  // Try parsing fullres string (e.g., "1920 x 1080")
  if (dataItem.fullres && typeof dataItem.fullres === 'string') {
    const match = dataItem.fullres.match(/(\d+)\s*x\s*(\d+)/i);
    if (match) {
      const h = parseInt(match[2], 10);
      if (h >= 2160) return 2160;
      if (h >= 1080) return 1080;
      if (h >= 720) return 720;
      if (h >= 480) return 480;
      return h;
    }
  }
  
  return 0; // Unknown resolution
}

/**
 * Get video codec/encoding info
 */
function getCodec(dataItem) {
  // Try vcodec field first
  const vcodec = dataItem.vcodec || dataItem['12'];
  if (!vcodec) return null;
  
  // Normalize codec names
  const codecStr = vcodec.toString().toUpperCase();
  if (codecStr.includes('265') || codecStr.includes('HEVC')) return 'HEVC';
  if (codecStr.includes('264') || codecStr.includes('AVC') || codecStr.includes('H264')) return 'H264';
  if (codecStr.includes('VP9')) return 'VP9';
  if (codecStr.includes('AV1')) return 'AV1';
  
  return vcodec;
}

/**
 * Format file size in human readable format
 */
function formatSize(sizeValue) {
  // If it's already a formatted string (e.g., "1.7 GB"), return it
  if (typeof sizeValue === 'string' && sizeValue.match(/\d+\.?\d*\s*(GB|MB|KB)/i)) {
    return sizeValue;
  }
  
  // If it's a number in bytes, format it
  if (!sizeValue || isNaN(sizeValue)) return null;
  
  const size = parseInt(sizeValue, 10);
  if (size >= 1073741824) return `${(size / 1073741824).toFixed(1)} GB`;
  if (size >= 1048576) return `${(size / 1048576).toFixed(1)} MB`;
  return `${(size / 1024).toFixed(1)} KB`;
}

module.exports = {
  search,
  getUrlPrefix,
  buildUrl,
  getStreamUrl,
  parseDuration,
  getDuration,
  getResolution,
  getCodec,
  formatSize
};

