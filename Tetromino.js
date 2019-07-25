import * as blocks from './blocks.js';
import { BRICK_SIZE, COLS, ROWS } from './config.js';
import { arrayToNum, numToArray } from './bit-tools.js';
import * as memory from './memory.js';

const types = Object.keys(blocks);

export default class Tetromino {
  constructor(name = types[(Math.random() * types.length) | 0]) {
    this.name = name;
    this.type = blocks[name];

    this.shape = Array.from(this.type.shape);
    this.w = this.type.w;
    this.h = this.type.h;
    this.x = ((COLS / 2) | 0) - 1;
    this.y = -1;
    this.rotation = 0;
    this.handlers = {};
  }

  rotate(anti = false) {
    let rotation =
      (this.rotation + (anti ? -1 : 1)) % (this.type.rotations || 4);

    let shape;

    if (rotation < 0) rotation = 3;

    if (rotation === 0) {
      shape = Array.from(this.type.shape);
    }

    if (rotation === 1) {
      // 90deg
      shape = numToArray(
        arrayToNum(this.type.shape) ^ this.type.rotate,
        this.shape.length
      );
    }

    if (rotation === 2) {
      // 180deg
      shape = Array.from(this.type.shape).reverse();
    }

    if (rotation === 3) {
      // 27deg
      shape = numToArray(
        arrayToNum(this.type.shape) ^ this.type.rotate,
        this.shape.length
      ).reverse();
    }

    const [w, h] =
      rotation % 2 == 1
        ? [this.type.h, this.type.w]
        : [this.type.w, this.type.h];

    if (memory.isFree({ shape, w, h, x: this.x, y: this.y })) {
      // commit
      this.shape = shape;
      this.w = w;
      this.h = h;
      this.rotation = rotation;

      this.emit('draw');
    }
  }

  move(direction) {
    const test = direction === 0 ? 'canMoveLeft' : 'canMoveRight';
    if (this[test]()) {
      if (direction) {
        this.x++;
      } else {
        this.x--;
      }
      this.emit('draw');
    }
  }

  drop() {
    if (this.canMoveDown()) {
      this.y++;
      this.emit('draw');
    } else {
      this.emit('stop');
    }
  }

  dropFast() {
    while (this.canMoveDown()) {
      this.y++;
    }
    this.emit('draw');
  }

  emit(type) {
    if (this.handlers[type]) {
      this.handlers[type]();
    }
  }

  canMoveDown() {
    return memory.isFree({ ...this, y: this.y + 1 });
  }

  canMoveLeft() {
    return memory.isFree({ ...this, x: this.x - 1 });
  }

  canMoveRight() {
    return memory.isFree({ ...this, x: this.x + 1 });
  }
}
