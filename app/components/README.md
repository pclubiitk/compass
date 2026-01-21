# Map (Component) System Documentation

> **Campus Compass Map Implementation**
> Built with [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) - An open-source TypeScript library for rendering interactive maps using WebGL.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Core Components](#core-components)
- [Global References](#global-references)
- [Location Management](#location-management)
- [Search Functionality](#search-functionality)
- [Custom Events](#custom-events)
- [MapLibre GL JS Integration](#maplibre-gl-js-integration)
- [Markers](#markers)
- [Camera Controls](#camera-controls)
- [Local Storage Caching](#local-storage-caching)

---

## Overview

The map system provides an interactive campus navigation experience with:
- **Location markers** with category-based icons and colors
- **User location tracking** with geolocation API
- **Search functionality** with fuzzy matching and coordinate support
- **Incremental data syncing** for efficient location updates
- **Custom marker interactions** for adding new locations

---

## Architecture

```
app/
├── (maps)/
│   ├── layout.tsx       # Map layout wrapper, drawer portal, location fetching
│   └── page.tsx         # Search bar, search logic, marker handling
├── components/
│   └── Map.tsx          # Core MapLibre GL JS map implementation
└── hooks/
    └── useLocations.ts  # SWR-based location fetching with incremental sync
```

### Data Flow

```
┌──────────────────┐     ┌────────────────┐     ┌─────────────────┐
│  useLocations()  │────▶│  MapsLayout    │────▶│    Map.tsx      │
│  (SWR + Cache)   │     │  (Orchestrator)│     │  (MapLibre GL)  │
└──────────────────┘     └────────────────┘     └─────────────────┘
         │                        │                       │
         ▼                        ▼                       ▼
  localStorage            window.mapRef            Marker rendering
  (cached_locations)      window.markerRef         User interactions
```

---

## Core Components

### 1. Map.tsx - Main Map Component

The core map component that initializes and manages the MapLibre GL JS instance.

**Key Features:**
- Map initialization with [CartoDB Positron](https://carto.com/basemaps/) style
- User location marker (draggable for adding locations)
- Category-based location markers with animations
- Zoom scaling for markers
- Geolocation permission handling

**MapLibre Initialization:**

```typescript
const map = new maplibregl.Map({
  container: mapContainer.current!,           // DOM element reference
  style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  center: [longitude, latitude],              // Starting position [lng, lat]
  zoom: 14                                    // Starting zoom level
});
```

> **Reference:** [MapLibre Map Class](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/)

### 2. layout.tsx - Maps Layout

Orchestrates the map and UI components:
- Dynamically imports Map.tsx (no SSR to avoid window errors)
- Manages AddLocationDrawer state
- Handles login dialog for unauthenticated users
- Creates portal for drawer isolation

### 3. page.tsx - Search Interface

Provides the search overlay:
- Fuzzy text search via backend API
- Coordinate search (lat, lng format)
- Results dropdown with location selection
- Search result marker placement

---

## Global References

The app extends the `Window` interface to share map references across components:

```typescript
// global.d.ts
declare global {
  interface Window {
    mapRef: React.RefObject<maplibregl.Map>;          // Map instance reference
    markerRef: React.RefObject<maplibregl.Marker[]>;  // Search markers array
  }

  interface WindowEventMap {
    "search-location": CustomEvent<{ lng: number; lat: number }>;
  }
}
```

<!-- ### Usage Pattern

```typescript
// Setting refs (in Map.tsx)
(window as any).mapRef = mapRef;
(window as any).markerRef = userMarkerRef;

// Accessing refs (in page.tsx)
const mapRef = window.mapRef;
if (mapRef?.current) {
  mapRef.current.flyTo({ center: [lng, lat], zoom: 14 });
}
``` -->

### markerRef Reference Pattern

The `markerRef` follows React's ref pattern with a `.current` property:

```typescript
// Initialization
if (!window.markerRef) {
  window.markerRef = { current: [] };
}

// Adding markers
window.markerRef.current.push(marker);

// Clearing markers
window.markerRef.current.forEach(m => m.remove());
window.markerRef.current = [];
```

---

## Location Management

### useLocations Hook

Implements efficient incremental data fetching:

```typescript
export function useLocations() {
  const { data, error, mutate, isValidating } = useSWR(
    "locations",
    async () => {
      const cachedTime = localStorage.getItem("cached_time");
      const sinceParam = cachedTime ? `?since=${encodeURIComponent(cachedTime)}` : "";
      const url = `${MAPS_URL}/api/maps/locations/incremental${sinceParam}`;
      // ...
    },
    {
      refreshInterval: 5 * 60 * 1000,  // Refresh every 5 minutes
      revalidateOnFocus: true,
      dedupingInterval: 30000,
      fallbackData: { locations: cached }
    }
  );
}
```

**Merge Strategy:**
1. Remove deleted locations from cache
2. Update existing locations with new data
3. Add new locations
4. Persist to localStorage with timestamp

---

## Search Functionality

### Fuzzy Search

```typescript
const fuzzySearch = async (searchQuery: string) => {
  const CACHE_KEY = "search_cache";
  const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");

  // Check cache first
  if (cache[searchQuery]) return cache[searchQuery];

  // Fetch from backend
  const res = await fetch(`${MAPS_URL}/api/maps/location/fuzzy?query=${encodeURIComponent(searchQuery)}`);
  const data = await res.json();

  // Cache results (with 5MB limit)
  cache[searchQuery] = data.results;
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

  return data.results;
};
```

### Coordinate Search

Direct coordinate input is supported in `lat, lng` format:

```typescript
const coordMatch = query.match(/^\s*(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)\s*$/);
if (coordMatch) {
  const lat = parseFloat(coordMatch[1]);
  const lng = parseFloat(coordMatch[3]);
  // Place marker and fly to location
}
```

---

## Custom Events

The map system uses custom DOM events for cross-component communication:

| Event | Dispatched From | Listened In | Purpose |
|-------|----------------|-------------|---------|
| `trigger-add-location` | BottomNav | Map.tsx, layout.tsx | Open add location drawer |
| `drawer-close` | layout.tsx | Map.tsx | Refresh markers after drawer closes |
| `refresh-markers` | layout.tsx | Map.tsx | Force marker re-render |
| `marker-selected` | Map.tsx | Other components | Notify when marker position changes |
| `map-ready` | Map.tsx | Other components | Map initialization complete |

**Example:**

```typescript
// Dispatching
window.dispatchEvent(new CustomEvent("marker-selected", { 
  detail: { lat, lng } 
}));

// Listening
useEffect(() => {
  const handler = () => renderMarkers();
  window.addEventListener("refresh-markers", handler);
  return () => window.removeEventListener("refresh-markers", handler);
}, [renderMarkers]);
```

---

## MapLibre GL JS Integration

### Installation

```bash
npm install maplibre-gl
```

### Required CSS

```typescript
import 'maplibre-gl/dist/maplibre-gl.css';
```

> **Important:** The CSS is required for Markers, Popups, and controls to render correctly.  
> **Reference:** [MapLibre CSS](https://maplibre.org/maplibre-gl-js/docs/#maplibre-css)

---

## Markers

### Custom Marker Creation

MapLibre supports custom HTML elements as markers:

```typescript
const el = document.createElement("div");
el.style.cursor = "pointer";

const inner = document.createElement("div");
inner.style.cssText = `
  width: 28px; height: 28px;
  background: ${color};
  border-radius: 50%;
  /* ... more styles */
`;

el.appendChild(inner);

const marker = new maplibregl.Marker({ 
  element: el, 
  anchor: "center" 
})
  .setLngLat([longitude, latitude])
  .addTo(map);
```

> 📖 **Reference:** [MapLibre Marker Class](https://maplibre.org/maplibre-gl-js/docs/API/classes/Marker/)

### Category-Based Markers

Locations are styled based on their `locationType`:

| Type | Color | Icon |
|------|-------|------|
| `food` | `#ef4444` (Red) | UtensilsCrossed |
| `lecturehall` | `#3b82f6` (Blue) | GraduationCap |
| `hostel` | `#22c55e` (Green) | Home |
| `admin` | `#f97316` (Orange) | Building2 |
| `recreation` | `#14b8a6` (Teal) | TreePalm |
| `default` | `#6b7280` (Gray) | MapPin |

### Marker Animations

Markers use CSS keyframe animations for visual feedback:

```css
@keyframes popIn {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
```

---

## Camera Controls

### flyTo

Smoothly animates the camera to a new position:

```typescript
map.flyTo({
  center: [longitude, latitude],
  zoom: 14,
  speed: 1.2,      // Animation speed
  curve: 1.5,      // Flight path curve
  essential: true  // Respects prefers-reduced-motion
});
```

> **Reference:** [flyTo Options](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/FlyToOptions/)

### Zoom Controls

```typescript
map.zoomIn();   // Increase zoom by 1
map.zoomOut();  // Decrease zoom by 1
map.setZoom(16); // Set specific zoom level
```

### Map Events

```typescript
map.on("click", (e) => {
  const { lng, lat } = e.lngLat;
  // Handle click at coordinates
});

map.on("moveend", () => {
  // Save camera position
  localStorage.setItem("map_center", JSON.stringify(map.getCenter().toArray()));
  localStorage.setItem("map_zoom", map.getZoom().toString());
});

map.on("load", () => {
  // Map fully loaded
  setMapLoaded(true);
});
```

> **Reference:** [Map Events](https://maplibre.org/maplibre-gl-js/docs/API/interfaces/MapEventType/)

---

## Local Storage Caching

The system uses localStorage for persistence:

| Key | Content | Purpose |
|-----|---------|---------|
| `cached_locations` | Location array JSON | Offline location data |
| `cached_time` | ISO timestamp | Incremental sync marker |
| `map_center` | `[lng, lat]` | Restore camera position |
| `map_zoom` | Number | Restore zoom level |
| `search_cache` | Search results object | Avoid repeated API calls |
| `selected_lat` | Number | Currently selected latitude |
| `selected_lon` | Number | Currently selected longitude |

### Cache Size Management

Search cache is automatically cleared if it exceeds 5MB:

```typescript
const size = new Blob([JSON.stringify(cache)]).size;
const MAX = 5 * 1024 * 1024; // 5MB
if (size > MAX) {
  localStorage.removeItem(CACHE_KEY);
}
```

---

## External Resources
- [MapLibre API Reference](https://maplibre.org/maplibre-gl-js/docs/API/)
- [MapLibre Examples](https://maplibre.org/maplibre-gl-js/docs/examples/)
- [MapLibre Style Specification](https://maplibre.org/maplibre-style-spec/)
- [CartoDB Basemaps](https://carto.com/basemaps/)

---