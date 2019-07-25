import { ROWS, COLS } from './config.js';

export const memory = new Uint8Array(ROWS * COLS);
export const pages = [Uint8Array.from(memory)];

export const loadMemory = test => {
  const lines = test.split('\n');
  let ctr = 0;
  for (let i = 0; i < lines.length; i++) {
    for (let k = 0; k < lines[i].length; k++) {
      const chr = lines[i][k];
      if (chr !== '0') {
        memory[ctr] = chr.charCodeAt(0);
      } else {
        memory[ctr] = 0;
      }
      ctr++;
    }
  }

  console.log(toString());
};

export const reset = () => {
  pages.length = 0;
  memory.fill(0);
};

export const forEach = cb => memory.forEach(cb);

export const getIndexForXY = (x, y, width = COLS) => {
  if (x < 0) {
    throw new Error(`out of bounds: x(${x}) < 0`);
  }

  if (x >= COLS) {
    throw new Error(`out of bounds: x(${x}) > COLS(${COLS})`);
  }

  if (y < 0) {
    throw new Error(`out of bounds: y(${y}) < 0`);
  }

  if (y >= ROWS) {
    throw new Error(`out of bounds: y(${y}) > ROWS(${ROWS})`);
  }

  return width * y + x;
};

export const getXYForIndex = i => {
  const x = i % COLS;
  const y = (i / COLS) | 0;

  return { x, y };
};

export const toString = (source = memory) =>
  source
    .reduce((acc, curr, i) => {
      const { y } = getXYForIndex(i);
      if (!acc[y]) acc[y] = '';
      acc[y] += curr ? String.fromCharCode(curr === 1 ? 88 : curr) : ' ';
      return acc;
    }, [])
    .join('\n');

export const write = tet => {
  const {
    x,
    y,
    w,
    h,
    shape,
    type: { char },
  } = tet;

  // ordering is important so we can jump straight to the shape value
  let ctr = 0;
  for (let k = y; k < y + h; k++) {
    for (let j = x; j < x + w; j++) {
      if (shape[ctr]) {
        let i = getIndexForXY(j, k);
        memory[i] = char.charCodeAt(0); // (ignored for now)
      }
      ctr++;
    }
  }

  pages.push(Uint8Array.from(memory));

  //   document.querySelector('#memdump').innerHTML = toString().replace(/0/g, '🔲').replace(/1/g, '🔳')
};

export const test = tet => {
  const { x, y, w, h, shape } = tet;

  const res = new Uint8Array(shape.length);
  let hit = false;
  // ordering is important so we can jump straight to the shape value
  let ctr = 0;
  for (let k = y; k < y + h; k++) {
    for (let j = x; j < x + w; j++) {
      if (shape[ctr]) {
        let i = getIndexForXY(j, k);
        res[ctr] = memory[i];
        if (shape[ctr] && memory[i]) {
          hit = true;
        }
      }
      ctr++;
    }
  }

  return { hit, res };
};

export const checkForLines = () => {
  const res = [];

  for (let y = ROWS - 1; y >= 0; y--) {
    for (let x = 0; x < COLS; x++) {
      if (!memory[getIndexForXY(x, y)]) {
        break;
      }

      if (x === COLS - 1) {
        res.push(y);
      }
    }
  }

  return res;
};

export const removeLine = y => {
  // copy all the content above down to and over this line
  memory.copyWithin(COLS, 0, getIndexForXY(COLS - 1, y - 1) + 1);

  // clear the top line last
  memory.fill(0, 0, COLS);

  pages.push(Uint8Array.from(memory));
};

export const isFree = tet => {
  try {
    return !test(tet).hit;
  } catch (E) {
    // console.log(E);
    return false;
  }
};
