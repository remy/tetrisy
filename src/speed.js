export const SPEEDS = [
  0.799,
  0.715,
  0.632,
  0.549,
  0.466,
  0.383,
  0.3,
  0.216,
  0.133,
  0.1,
  0.083,
  0.083,
  0.083,
  0.067,
  0.067,
  0.067,
  0.05,
  0.05,
  0.05,
  0.033,
  0.033,
  0.033,
  0.033,
  0.033,
  0.033,
  0.033,
  0.033,
  0.033,
  0.033,
  0.017,
];

export function speedForLevel(level) {
  let speed = null;
  if (level >= SPEEDS.length - 1) {
    speed = SPEEDS[SPEEDS.length - 1];
  } else {
    speed = SPEEDS[level];
  }

  return speed * 1000;
}
