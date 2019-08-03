let seed = Date.now();

let ctr = 0;

export function setSeed(s) {
  seed = s;
}

export function resetCounter() {
  ctr = 0;
}

export default function pick(n) {
  ctr++;
  let index = random() >> 8; // high byte
  index += ctr;

  return index % n;
}

function random() {
  const value = ((((seed >> 9) & 1) ^ ((seed >> 1) & 1)) << 15) | (seed >> 1);
  seed = value;
  return value;
}
