// -----------------------------------------------------------------------------
// Global Type Declarations
// -----------------------------------------------------------------------------
// These declarations make TypeScript aware of the added window properties
// and custom events, preventing type errors when they are accessed globally.
// -----------------------------------------------------------------------------
//currently
// This file extends the global `window` interface to include shared references
// for the MapLibre map and marker instances, as well as a custom event type
// ("search-location") used across the app for map interactions.

export {};
declare global {
  interface Window {
    mapRef: React.RefObject<maplibregl.Map | null>;
    markerRef: React.RefObject<maplibregl.Marker | null>;
    
  }
   interface WindowEventMap {
    "search-location": CustomEvent<{ lng: number; lat: number }>;
  }
}