export const generateCircularPath = (
  center: { latitude: number; longitude: number } = {
    latitude: 37.78825,
    longitude: -122.4324,
  },
  radius: number,
  numPoints: number,
) => {
  const points = [];
  const earthRadius = 6371000; // radius of Earth in meters

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * (2 * Math.PI);
    const dx = radius * Math.cos(angle);
    const dy = radius * Math.sin(angle);

    const deltaLatitude = (dx / earthRadius) * (180 / Math.PI);
    const deltaLongitude =
      (dy / (earthRadius * Math.cos((center.latitude * Math.PI) / 180))) *
      (180 / Math.PI);

    points.push({
      latitude: center.latitude + deltaLatitude,
      longitude: center.longitude + deltaLongitude,
    });
  }

  return points;
};
