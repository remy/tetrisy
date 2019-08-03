/* eslint-env node */
import { test, beforeEach } from 'tap';
import * as memory from '../src/memory.js';
import * as TESTS from '../src/tests.js';

function arrayFrom(n, size) {
  return new Array(size).fill(n);
}

beforeEach(done => {
  memory.reset();
  done();
});

test('loading memory', t => {
  memory.loadMemory(arrayFrom(1, 10).join(''));
  t.same(
    memory.memory,
    Uint8Array.from(arrayFrom(0, 190).concat(arrayFrom('1'.charCodeAt(0), 10)))
  );
  t.end();
});

test('appending 1 line', t => {
  memory.loadMemory(arrayFrom('X', 10).join(''));
  memory.appendLines(1);

  t.equals(memory.toString().trim(), 'XXXXXXXXXX\nXXXX XXXXX');
  t.end();
});

test('appending 1 line twice', t => {
  memory.loadMemory(arrayFrom('X', 10).join(''));
  memory.appendLines(1);
  t.equals(memory.toString().trim(), 'XXXXXXXXXX\nXXXX XXXXX');
  memory.appendLines(1);
  t.equals(memory.toString().trim(), 'XXXXXXXXXX\nXXXX XXXXX\nXXXX XXXXX');

  t.end();
});

test('appending 1, 2, 1 line', t => {
  memory.loadMemory(arrayFrom('X', 10).join(''));
  memory.appendLines(1);
  t.equals(memory.toString().trim(), 'XXXXXXXXXX\nXXXX XXXXX');
  memory.appendLines(2);
  t.equals(
    memory.toString().trim(),
    'XXXXXXXXXX\nXXXX XXXXX\nXXXX XXXXX\nXXXX XXXXX'
  );
  memory.appendLines(1);
  t.equals(
    memory.toString().trim(),
    'XXXXXXXXXX\nXXXX XXXXX\nXXXX XXXXX\nXXXX XXXXX\nXXXX XXXXX'
  );

  t.end();
});

test('complex add 1 line twice', t => {
  memory.loadMemory(TESTS.A.base);
  const res = memory.toString().trim() + '\nXXXX XXXXX';
  memory.appendLines(1);
  t.equals(memory.toString().trim(), res);

  t.end();
});
