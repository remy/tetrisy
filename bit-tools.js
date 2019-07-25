export const arrayToNum = a => a.reduce((acc, curr, i, all) => acc + (curr << (all.length - 1 - i)), 0);

export const numToArray = (n, length = 6) => {
  return Array.from({ length }, (_, i) => {
    return n & (2 ** i) ? 1 : 0
  }).reverse();
}