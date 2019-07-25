/*

100
110
011

1111


*/

/* To work out the rotation:

Draw the shape, then manually rotate the bits clockwise.
Then serialise into binary, so that you have two numbers,
for DUCK we have:

0,1,1       011110
1,1,0

1,0         101101
1,1
0,1

Then: 0b011110 ^ 0b101101 = 30 xor 45 = 51 … therefore our rotation is 51.

So 0b011110 ^ 51 = rotated clockwise = 45, and 45 ^ 51 = 30.

To rotate 180deg, the order is reversed.
To rotate 270deg, rotation is applied then reversed.


*/

export const T = {
  char: 'T',
  rotate: 39, // 0b100111
  shape: [1, 1, 1, 0, 1, 0],
  w: 3,
  h: 2,
};

export const DUCK = {
  char: 'S',
  rotate: 51, // 0b110011
  shape: [0, 1, 1, 1, 1, 0],
  w: 3,
  h: 2,
};

export const R_DUCK = {
  char: 'Z',
  rotate: 45,
  shape: [1, 1, 0, 0, 1, 1],
  w: 3,
  h: 2,
};

export const SQUARE = {
  char: 'O',
  rotate: 0,
  shape: [1, 1, 1, 1],
  w: 2,
  h: 2,
};

export const L = {
  char: 'L',
  rotate: 23, // 0b10111
  shape: [1, 0, 1, 0, 1, 1],
  w: 2,
  h: 3,
};

export const J = {
  char: 'J',
  rotate: 48,
  shape: [0, 1, 0, 1, 1, 1],
  w: 2,
  h: 3,
};

export const BAR = {
  char: 'I',
  rotate: 0,
  shape: [1, 1, 1, 1],
  w: 1,
  h: 4,
};
