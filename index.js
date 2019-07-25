import Vue from './vue.js';
import makeCanvas from './canvas.js';
import Tet from './Tetromino.js';
import { BRICK_SIZE, STARTING_SPEED, COLS, ROWS } from './config.js';
import * as memory from './memory.js';

const game = new Vue({
  el: '#controls',
  filters: {
    pad: s => s.toString().padStart(3, '0'),
  },
  data: {
    pageId: 0,
    score: 0,
    speed: STARTING_SPEED,
    lastLoop: 0,
    pages: memory.pages,
    debug: false,
    running: false,
    down: false,
  },
  methods: {
    runningChange() {
      this.pageId = memory.pages.length - 1;
      memory.memory.set(memory.pages[this.pageId], 0);
    },
    pageChange() {
      memory.memory.set(memory.pages[this.pageId], 0);
      drawMemory();
    },
    cancelInput() {
      clearTimeout(this.down);
      this.down = false;
    },
    input(dir, e) {
      document.body.dataset.input = 'mouse';

      const move = (repeat = true) => {
        if (dir === 'left') {
          game.current.move(0);
        }

        if (dir === 'right') {
          game.current.move(1);
        }

        if (dir === 'rotate') {
          game.current.rotate();
        }

        if (dir === 'down') {
          const touches = e.changedTouches || [true];
          if (touches.length === 1) {
            game.current.drop();
          }
        }

        if (repeat) {
          this.down = setTimeout(move, 50);
        }
      };

      this.down = setTimeout(move, 500);
      move(false);

      e.target.blur();
    },
  },
});

// how much does a block take up?
// 40x40 (for now)

function reset() {
  game.running = true;
  game.speed = STARTING_SPEED;
  game.lastLoop = 0;
  game.score = 0;
}

function updateSpeed() {
  game.speed = (10 - ((game.score / 10) | 0)) * 0.05 * 1000;
}

function drawMemory() {
  game.ctx.canvas.width = game.ctx.canvas.width;
  game.ctx.fillStyle = 'white';

  const c = game.ctx;
  memory.forEach((v, i) => {
    if (v) {
      const { x, y } = memory.getXYForIndex(i);
      c.rect(x * BRICK_SIZE, y * BRICK_SIZE, BRICK_SIZE, BRICK_SIZE);
    }
  });
  c.fill();
}

function renderTetromino(brick) {
  drawMemory();

  const prev = document.querySelector('#brick');
  if (prev) prev.remove();
  const c = makeCanvas('brick');

  c.canvas.hidden = true;
  c.canvas.className = 'debug';
  c.canvas.width = BRICK_SIZE * brick.w;
  c.canvas.height = BRICK_SIZE * brick.h;
  c.fillStyle = 'white';

  brick.shape.map((e, i) => {
    let x = 0;
    let y = 0;

    x = BRICK_SIZE * (i % brick.w);
    y = BRICK_SIZE * ((i / brick.w) | 0);

    if (e) {
      c.rect(x, y, BRICK_SIZE, BRICK_SIZE);
    }
    c.fill();
  });

  c.fill();

  game.ctx.drawImage(c.canvas, brick.x * BRICK_SIZE, brick.y * BRICK_SIZE);
}

async function flashLine(y) {
  return new Promise(resolve => {
    const styles = ['white', 'black'];
    const timer = setInterval(() => {
      game.ctx.fillStyle = styles.reverse()[0];
      game.ctx.fillRect(0, y * BRICK_SIZE, COLS * BRICK_SIZE, BRICK_SIZE);
    }, 127);
    setTimeout(() => {
      clearInterval(timer);
      game.ctx.fillStyle = 'white';
      resolve();
    }, 1000);
  });
}

async function stop() {
  memory.write(game.current);

  const lines = memory.checkForLines();

  if (lines.length) {
    game.running = false;
    await Promise.all(
      lines.map((y, i) => {
        memory.removeLine(y + i);
        return flashLine(y); // note that flashing is done on printed lines and not memory
      })
    );
    game.score += lines.length;
    updateSpeed();
    game.running = true;
    loop();
  }

  makeNewBlock();
}

const randInt = (a, b) => ~~(Math.random() * (b - a) + a);

function glitch() {
  const { ctx } = game;
  const canvas = ctx.canvas;
  const { width: w, height: h } = canvas;

  for (let i = 0; i < randInt(1, 13); i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const spliceWidth = w - x;
    const spliceHeight = randInt(5, h / 3);
    ctx.drawImage(
      canvas,
      0,
      y,
      spliceWidth,
      spliceHeight,
      x,
      y,
      spliceWidth,
      spliceHeight
    );
    ctx.drawImage(
      canvas,
      spliceWidth,
      y,
      x,
      spliceHeight,
      0,
      y,
      x,
      spliceHeight
    );
  }

  writeText('GAME OVER');
}

function writeText(text) {
  game.ctx.globalCompositeOperation = 'xor';
  game.ctx.font = '4vh monospace';
  game.ctx.fillText(text, BRICK_SIZE * COLS * 0.15, (ROWS * BRICK_SIZE) / 2);
  game.ctx.globalCompositeOperation = 'source-over';
}

function makeNewBlock() {
  game.current = new Tet();
  if (!memory.isFree(game.current)) {
    game.running = false; // game over
    setInterval(() => {
      drawMemory();
      writeText('GAME OVER');
      setTimeout(glitch, randInt(250, 1000));
    }, 500);
  }
  renderTetromino(game.current);
  game.current.handlers.draw = () => {
    if (game.running) renderTetromino(game.current);
  };
  game.current.handlers.stop = stop;
}

function loop(delta) {
  if (game.running) {
    if (delta - game.lastLoop > game.speed) {
      game.lastLoop = delta;
      game.current.drop();
    }
    requestAnimationFrame(loop);
  }
}

function handleKeys(e) {
  document.body.dataset.input = 'keys';
  if (e.which === 37) {
    // left
    game.current.move(0);
    return;
  }

  if (e.which === 40) {
    // down
    game.current.drop();
    return;
  }

  if (e.which === 39) {
    // right
    game.current.move(1);
    return;
  }

  if (e.which === 32) {
    // space
    game.current.rotate(e.shiftKey);
  }

  if (e.which === 13) {
    // enter
    game.current.dropFast();
  }

  if (e.which === 191) {
    // ?
    game.debug = !game.debug;
  }
}

function setup() {
  reset();

  Array.from(document.querySelectorAll('canvas')).forEach(_ => {
    document.body.removeChild(_);
  });

  // TODO remove the canvas
  const ctx = makeCanvas('main');

  game.width = BRICK_SIZE * COLS;
  game.height = BRICK_SIZE * ROWS;

  ctx.canvas.width = game.width;
  ctx.canvas.height = game.height;

  ctx.canvas.style.borderWidth = BRICK_SIZE + 'px';

  game.ctx = ctx;

  window.onkeydown = handleKeys;

  makeNewBlock();
  requestAnimationFrame(loop);
}

function test(t = 'L') {
  renderTetromino(new Tet(t));
}

setup();

window.setup = setup;
window.game = game;
window.test = test;
window.memory = memory;
window.drawMemory = drawMemory;
window.render = () => renderTetromino(game.current);
