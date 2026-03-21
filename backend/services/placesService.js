const axios = require('axios');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const KEYWORDS = ['child', 'therapy', 'autism', 'rehabilitation', 'pediatric'];

const buildAddress = (tags = {}) => {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'],
    tags['addr:city'],
    tags['addr:state'],
    tags['addr:postcode'],
    tags['addr:country'],
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : 'Address not available';
};

const keywordScore = (text) => {
  const lower = (text || '').toLowerCase();
  return KEYWORDS.reduce((acc, keyword) => acc + (lower.includes(keyword) ? 1 : 0), 0);
};

const toCenter = (element) => {
  const tags = element.tags || {};
  const name = tags.name || tags.operator || 'Autism Support Center';
  const address = buildAddress(tags);

  return {
    name,
    address,
    latitude: element.lat,
    longitude: element.lon,
    mapsUrl: `https://www.openstreetmap.org/?mlat=${element.lat}&mlon=${element.lon}#map=16/${element.lat}/${element.lon}`,
    _score: keywordScore(`${name} ${address} ${JSON.stringify(tags)}`),
  };
};

const geocodeCity = async (city, state, country) => {
  const location = [city, state, country].filter(Boolean).join(', ');

  const response = await axios.get(NOMINATIM_URL, {
    params: {
      q: location,
      format: 'json',
      limit: 1,
    },
    timeout: 8000,
    headers: {
      'User-Agent': 'AutiSense/1.0 (autism-screening-app)',
      'Accept-Language': 'en',
    },
  });

  if (!Array.isArray(response.data) || response.data.length === 0) {
    return null;
  }

  return {
    latitude: Number(response.data[0].lat),
    longitude: Number(response.data[0].lon),
  };
};

const fetchOverpassCenters = async (lat, lon, radiusMeters = 5000) => {
  const query = `
[out:json][timeout:15];
node["amenity"~"hospital|clinic|rehabilitation"](around:${radiusMeters},${lat},${lon});
out body;
`;

  const response = await axios.post(OVERPASS_URL, query, {
    headers: { 'Content-Type': 'text/plain' },
    timeout: 15000,
  });

  return Array.isArray(response.data?.elements) ? response.data.elements : [];
};

/**
 * Fetch autism-related centers using OpenStreetMap (Nominatim + Overpass).
 * @param {string} city
 * @param {string} state
 * @param {string} country
 * @param {number} limit
 * @returns {Promise<Array<{name: string, address: string, latitude: number, longitude: number, mapsUrl: string}>>}
 */
exports.getNearbyAutismCenters = async (city, state, country, limit = 5) => {
  try {
    if (!city) {
      return [];
    }

    const coords = await geocodeCity(city, state, country);
    if (!coords) {
      return [];
    }

    const rawCenters = await fetchOverpassCenters(coords.latitude, coords.longitude, 5000);

    const relevant = rawCenters
      .map(toCenter)
      .filter((center) => center._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, Math.min(Math.max(limit, 3), 5))
      .map(({ _score, ...center }) => center);

    return relevant;
  } catch (err) {
    console.error('[placesService] OSM lookup failed:', err.message);
    return [];
  }
};
