# Nearest Autism Support Centers Feature - Technical Explanation

## Overview
The application automatically suggests the 3 nearest autism support centers based on the user's location when they view their screening results. This feature helps families find local resources and professional support immediately after completing a screening.

---

## How It Works

### Step-by-Step Flow

#### 1. **User Completes Screening**
- During the screening, the user provides their location (city, state, country)
- This location data is saved in the database along with their screening results

#### 2. **Results Page Loads**
- When the user navigates to the screening results page, the frontend automatically fetches nearby centers
- The location is extracted from their saved profile
- **API Call:** `GET /api/centers?city=Bangalore&state=Karnataka&country=India`

#### 3. **Backend Processing**
The backend performs several steps:

**a) Geocoding (Convert Location Name to Coordinates)**
- Uses **Nominatim API** (OpenStreetMap) to convert the city name into latitude/longitude
- Example: "Bangalore" → (12.9716°N, 77.5946°E)

**b) Search for Nearby Centers**
- Uses **SerpAPI** to search Google for "autism therapy center" or "autism support center" in that city
- Returns multiple results with address, website, phone number

**c) Calculate Distances**
- For each center found, the backend calculates the distance from the user's location
- Uses the **Haversine Formula** for great-circle distance calculation:
  ```
  Distance = √[(Δlat² + Δlon²)] × Earth's Radius (6,371 km)
  ```

**d) Handle Missing Coordinates**
- If a center doesn't have coordinates, **Nominatim geocodes** the address to get lat/lon
- This ensures all centers have calculated distances

#### 4. **Sort and Return Results**
- Centers are sorted by distance (nearest first)
- Top 3 closest centers are returned to the frontend
- Response includes: name, address, distance, coordinates, and Google Maps URL

#### 5. **Display on UI**
- **Nearest center** is highlighted in an emerald box at the top
- **All centers** displayed in a table with:
  - Center name
  - Address
  - Distance (in kilometers)
  - "Navigate" button (opens Google Maps directions)

---

## Technologies Used

### **Frontend Technologies**
| Technology | Purpose |
|-----------|---------|
| **React.js** | Interactive UI component (ScreeningResults.jsx) |
| **Axios** | HTTP client for API calls |
| **Tailwind CSS** | Responsive styling and design |
| **React Motion** | Smooth animations when loading |

**Frontend File:** `frontend/src/pages/ScreeningResults.jsx` (lines 54-410)

### **Backend Technologies**
| Technology | Purpose |
|-----------|---------|
| **Node.js + Express.js** | HTTP server and routing |
| **MongoDB** | Database storing user location data |
| **Axios** | Making HTTP requests to external APIs |
| **Environment Variables (.env)** | Storing API keys securely |

**Backend Files:**
- `backend/routes/centersRoutes.js` - Route definition
- `backend/controllers/centersController.js` - Request handling
- `backend/server.js` - Server setup

### **External APIs & Services**
| Service | Purpose | Free/Paid |
|---------|---------|-----------|
| **SerpAPI** | Search engine results for "autism centers" | Requires API key (free tier available) |
| **Nominatim (OpenStreetMap)** | Geocoding: Convert addresses ↔ coordinates | **Free** (no key required) |
| **Google Maps** | Navigation links (no API key needed for URL scheme) | Free (URL based) |

### **Algorithms & Formulas**
| Name | Purpose |
|------|---------|
| **Haversine Formula** | Calculate accurate distance between two geographic points |
| **Deduplication Logic** | Remove duplicate centers from search results |
| **Sorting Algorithm** | Rank centers by distance (nearest first) |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│                  ScreeningResults.jsx Component                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Extracts: {city, state, country} from screening data    │  │
│  │ Calls: centersAPI.getNearby()                          │  │
│  └────────────────────────┬─────────────────────────────────┘  │
└─────────────────────────────┼─────────────────────────────────────┘
                              │ HTTP GET /api/centers
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Express.js)                     │
│            centersController.getCenters()                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Step 1: Authenticate user (JWT token)                   │  │
│  │ Step 2: Extract {city, state, country} from query       │  │
│  └────────────────────────┬─────────────────────────────────┘  │
└─────────────────────────────┼─────────────────────────────────────┘
                              │
        ┌─────────────────────┼──────────────────────┐
        ↓                     ↓                      ↓
┌───────────────┐    ┌──────────────────┐   ┌─────────────────┐
│  NOMINATIM    │    │   SERPAPI        │   │   HAVERSINE     │
│  SERVICE      │    │   SERVICE        │   │   FORMULA       │
├───────────────┤    ├──────────────────┤   ├─────────────────┤
│ Geocode City: │    │ Search for:      │   │ Calculate:      │
│ City Name→    │    │ "autism center   │   │ Distance from   │
│ Lat/Long      │    │  in {city}"      │   │ user to each    │
│               │    │                  │   │ center (km)     │
│ Example:      │    │ Returns:         │   │                 │
│ Bangalore→    │    │ - Name           │   │ Formula:        │
│ 12.97°N       │    │ - Address        │   │ d = √(Δlat² +   │
│ 77.59°E       │    │ - Phone          │   │ Δlon²) × 6371km │
└───────────────┘    │ - Website        │   │                 │
                     │ - Lat/Long       │   │                 │
                     │ (if available)   │   │                 │
                     └──────────────────┘   └─────────────────┘
        │                     │                      │
        └─────────────────────┴──────────────────────┘
                              │
                              ↓
        ┌─────────────────────────────────────────┐
        │  PLACE SERVICE (placesService.js)       │
        │  getNearbyAutismCenters()               │
        ├─────────────────────────────────────────┤
        │ 1. Geocode user location                │
        │ 2. Search for centers via SerpAPI       │
        │ 3. For each center:                     │
        │    - If no coords: geocode address      │
        │    - Calculate distance (Haversine)     │
        │ 4. Sort by distance (nearest first)     │
        │ 5. Deduplicate results                  │
        │ 6. Return top 3 centers                 │
        └────────────────┬──────────────────────┘
                         │
                         ↓
        ┌─────────────────────────────────────────┐
        │  RESPONSE TO FRONTEND                   │
        ├─────────────────────────────────────────┤
        │ [                                       │
        │   {                                     │
        │     "name": "Center Name",              │
        │     "address": "123 Main St",           │
        │     "distance": "2.5 km",               │
        │     "latitude": 12.960,                 │
        │     "longitude": 77.595,                │
        │     "mapsUrl": "https://maps.google..." │
        │   },                                    │
        │   ...                                   │
        │ ]                                       │
        └────────────────┬──────────────────────┘
                         │
                         ↓ HTTP 200 OK
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND DISPLAY                             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✓ Highlight nearest center (emerald box)                │  │
│  │ ✓ Show table of all 3 centers with:                     │  │
│  │   - Name                                                 │  │
│  │   - Address                                              │  │
│  │   - Distance                                             │  │
│  │   - [Navigate] button → Google Maps                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Features

### ✅ **Smart Location Detection**
- Automatically extracts user's city from screening data
- No need for manual address entry for finding centers

### ✅ **Real-Time Distance Calculation**
- Uses accurate Haversine formula for geographical distances
- Shows distance in kilometers
- Considers Earth's curvature for precision

### ✅ **Multiple Data Sources**
- Combines **SerpAPI** (crowdsourced search results) with **Nominatim** (official map data)
- Ensures comprehensive and up-to-date center information

### ✅ **User-Friendly Navigation**
- "Navigate" button opens Google Maps with directions
- Works on mobile and desktop
- No additional map registration required

### ✅ **Integration with Reports**
- Nearby centers are included in downloadable PDF medical reports
- Helps healthcare providers recommend local resources

### ✅ **Secure & Authenticated**
- Location data is private
- API requires user authentication (JWT token)
- Centers are only shown to logged-in users

---

## Technical Details

### **Haversine Formula Implementation**
```javascript
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth's radius in kilometers
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c; // Distance in km
};
```

### **API Endpoint**
- **URL:** `GET /api/centers`
- **Query Parameters:**
  - `city` (required): City name
  - `state` (optional): State/Province
  - `country` (optional): Country name
- **Authentication:** Bearer token (JWT)
- **Response:** JSON array of up to 3 centers
- **Status Codes:**
  - `200`: Success
  - `400`: Missing required parameters
  - `401`: Unauthorized
  - `500`: Server error

### **Data Storage (MongoDB)**
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  parentLocation: {
    city: String,      // e.g., "Bangalore"
    state: String,     // e.g., "Karnataka"
    country: String,   // e.g., "India"
    postalCode: String // e.g., "560001"
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## Why These Technologies?

### **Why Haversine Formula?**
- ✅ Accurate distance calculation between two points on Earth
- ✅ Accounts for Earth's spherical shape
- ✅ More accurate than simple Euclidean distance for geographic data
- ✅ Lightweight and fast computation

### **Why Nominatim (OpenStreetMap)?**
- ✅ Free, no API key required
- ✅ Comprehensive global coverage
- ✅ Open-source and reliable
- ✅ No rate limiting for reasonable use

### **Why SerpAPI?**
- ✅ Access to Google search results without web scraping
- ✅ Structured data (addresses, phone numbers, ratings)
- ✅ Real-time, up-to-date information
- ✅ Prevents legal/ethical issues with web scraping

### **Why Google Maps URLs?**
- ✅ No API authentication needed for navigation links
- ✅ Works seamlessly on mobile and desktop
- ✅ Opens in user's preferred maps application
- ✅ Reduces server load (no routing calculations needed)

---

## Performance Considerations

| Metric | Value |
|--------|-------|
| **API Response Time** | ~2-5 seconds (depends on SerpAPI) |
| **Distance Calculation** | < 1 millisecond |
| **Geocoding** | ~1-2 seconds per location |
| **Result Limit** | 3 centers (optimized for UX) |
| **Caching** | Not implemented (fresh results each time) |

---

## Security Features

✅ **User Authentication:** Requires JWT token
✅ **Location Privacy:** Only own location accessible
✅ **API Keys:** Stored in environment variables (.env)
✅ **CORS:** Protected backend endpoints
✅ **Rate Limiting:** Implicit through SerpAPI quotas

---

## Future Enhancements

1. **Caching:** Store center results for 24-48 hours to reduce API calls
2. **User Preferences:** Filter centers by specialization (speech therapy, behavioral, etc.)
3. **Ratings Integration:** Show Google/Yelp ratings
4. **Appointment Booking:** Direct integration with center booking systems
5. **Accessibility Info:** Distance from public transportation, wheelchair access

---

## Summary

The nearest autism centers feature is a **location-based recommendation system** that:
- ✅ **Reads** user location from screening data
- ✅ **Searches** for nearby autism support centers using SerpAPI
- ✅ **Calculates** distances using geographic coordinates and Haversine formula
- ✅ **Displays** the 3 nearest centers with navigation links
- ✅ **Integrates** results into PDF medical reports

**Technology Stack:**
- Frontend: React.js + Axios
- Backend: Node.js + Express.js + MongoDB
- Algorithms: Haversine formula for distance
- APIs: SerpAPI (center search) + Nominatim (geocoding) + Google Maps (navigation)
