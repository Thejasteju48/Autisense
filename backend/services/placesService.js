const axios = require('axios');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const SERP_API_URL = 'https://serpapi.com/search.json';

const normalize = (v) => String(v || '').trim();

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2))
    * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const buildGoogleNavigateUrl = (lat, lng) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

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

const geocodeAddress = async (addressText) => {
  if (!addressText) return null;

  const response = await axios.get(NOMINATIM_URL, {
    params: {
      q: addressText,
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

const fetchSerpApiCenters = async (city) => {
  const apiKey = normalize(process.env.SERP_API_KEY);
  if (!apiKey) {
    throw new Error('SERP_API_KEY is not configured');
  }

  const response = await axios.get(SERP_API_URL, {
    params: {
      engine: 'google',
      q: `autism therapy center in ${city}`,
      api_key: apiKey,
      hl: 'en',
      gl: 'in',
    },
    timeout: 12000,
  });

  const data = response.data || {};

  if (Array.isArray(data?.local_results?.places)) {
    return data.local_results.places;
  }

  if (Array.isArray(data?.local_results)) {
    return data.local_results;
  }

  if (Array.isArray(data?.places)) {
    return data.places;
  }

  return [];
};

/**
 * Fetch autism-related centers using SerpAPI (primary) and Nominatim (fallback geocoding).
 * @param {string} city
 * @param {string} state
 * @param {string} country
 * @param {number} limit
 * @returns {Promise<Array<{name: string, address: string, latitude: number, longitude: number, distanceKm: number, distanceText: string, mapsUrl: string}>>}
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

    const rawCenters = await fetchSerpApiCenters(city);
    const centers = [];

    for (const item of rawCenters) {
      const name = normalize(item?.title) || 'Autism Support Center';
      const address = normalize(item?.address) || normalize(item?.street) || 'Address not available';

      let latitude = Number(item?.gps_coordinates?.latitude);
      let longitude = Number(item?.gps_coordinates?.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        const fullAddress = [name, address, city, state, country].filter(Boolean).join(', ');
        const geocoded = await geocodeAddress(fullAddress).catch(() => null);
        latitude = geocoded?.latitude;
        longitude = geocoded?.longitude;
      }

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        continue;
      }

      const distanceKm = haversineKm(coords.latitude, coords.longitude, latitude, longitude);

      centers.push({
        name,
        address,
        latitude,
        longitude,
        distanceKm,
        distanceText: `${distanceKm.toFixed(1)} km`,
        mapsUrl: buildGoogleNavigateUrl(latitude, longitude),
      });
    }

    const uniqueByNameAddress = new Map();
    centers.forEach((center) => {
      const key = `${center.name.toLowerCase()}|${center.address.toLowerCase()}`;
      const existing = uniqueByNameAddress.get(key);
      if (!existing || center.distanceKm < existing.distanceKm) {
        uniqueByNameAddress.set(key, center);
      }
    });

    const relevant = Array.from(uniqueByNameAddress.values())
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, Math.max(1, Math.min(limit, 3)));

    return relevant;
  } catch (err) {
    console.error('[placesService] SerpAPI lookup failed:', err.message);
    return [];
  }
};
