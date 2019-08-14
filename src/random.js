let seed = Date.now() & 0xff;

let ctr = 0;

export function setSeed(s) {
  seed = s;
}

export function resetCounter() {
  ctr = 0;
}

export default function random(n = 7) {
  ctr++;
  let value = ((((seed >> 9) & 1) ^ ((seed >> 1) & 1)) << 15) | (seed >> 1);

  seed = value;
  value >>= 8; // high byte
  value += ctr;
  value %= n;

  return value;
}
