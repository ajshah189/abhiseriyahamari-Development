// Static data gateway. Today this reads the local data.js payload; when AR
// Airways gets a backend, this file becomes the API adapter and the modules
// above it should not need to change.
export function loadMapData() {
  const data = window.AR_STATIC_DATA;
  if (!data) {
    throw new Error("Map data is unavailable. Ensure data.js loads before script.js.");
  }

  return {
    mapImages: data.mapImages,
    mapSize: data.mapSize,
    locations: data.locations,
    roomZones: data.roomZones,
    roadNodes: data.roadNodes,
    roadEdges: data.roadEdges,
  };
}
