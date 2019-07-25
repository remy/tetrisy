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
  rotate: 160,
  shape: [0, 0, 0, 1, 1, 1, 0, 1, 0], // 000111010 => 010011010
  w: 3,
  h: 3,
};

export const DUCK = {
  rotations: 2,
  char: 'S',
  rotate: 135,
  shape: [0, 0, 0, 0, 1, 1, 1, 1, 0], // 0b000011110 ^ 0b010011001
  w: 3,
  h: 3,
};

export const R_DUCK = {
  rotations: 2,
  char: 'Z',
  rotate: 105,
  shape: [0, 0, 0, 1, 1, 0, 0, 1, 1], // 000110011 => 001011010
  w: 3,
  h: 3,
};

export const SQUARE = {
  rotations: 1,
  char: 'O',
  rotate: 0,
  shape: [0, 0, 0, 1, 1, 0, 1, 1, 0],
  w: 3,
  h: 3,
};

export const L = {
  char: 'L',
  rotate: 175,
  shape: [0, 0, 0, 1, 1, 1, 1, 0, 0], // 000111100 => 010010011
  w: 3,
  h: 3,
};

export const J = {
  char: 'J',
  rotate: 175,
  shape: [0, 0, 0, 1, 1, 1, 0, 0, 1], // 000111100 => 010010011
  w: 3,
  h: 3,
};

export const BAR = {
  rotations: 2,
  char: 'I',
  rotate: 11554,
  shape: [0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0], // 0b0000111100000000 ^ 0b0010001000100010
  w: 4,
  h: 4,
};
