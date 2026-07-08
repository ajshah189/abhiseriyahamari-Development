export function pointsToAttr(points) {
  return points.map((p) => p.join(",")).join(" ");
}

export function attrToPoints(attr) {
  return attr.trim().split(" ").map((pair) => pair.split(",").map(Number));
}

export function polygonCentroid(polygon) {
  const cx = polygon.reduce((sum, point) => sum + point[0], 0) / polygon.length;
  const cy = polygon.reduce((sum, point) => sum + point[1], 0) / polygon.length;
  return [cx, cy];
}

export function pathLength(points) {
  return points.reduce(
    (sum, point, index) => index === 0
      ? 0
      : sum + Math.hypot(point[0] - points[index - 1][0], point[1] - points[index - 1][1]),
    0
  );
}
