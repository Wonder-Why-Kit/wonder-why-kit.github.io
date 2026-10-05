export function groundHeight(x, z) {
  if (z >= -8) return -0.025;
  const distance = -z - 8;
  return (
    Math.sin(Math.min(1, distance / 18) * Math.PI) *
      (1.45 + 0.45 * Math.sin(x * 0.16) + 0.25 * Math.sin(x * 0.33 + 1)) -
    Math.max(0, distance - 18) * 0.34 -
    0.025
  );
}

/** Qualitative model, not a measured aerodynamic solver. */
export function fallSpeed(weight, wingSize) {
  if (!(weight > 0) || !(wingSize > 0))
    throw new RangeError("Weight and wing size must be positive");
  return 0.65 * Math.sqrt(weight / 0.3 / wingSize);
}
