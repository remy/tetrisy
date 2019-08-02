import Vue from './vue.js';
import makeCanvas from './canvas.js';
import Tet from './Tetromino.js';
import {
  BRICK_SIZE,
  STARTING_SPEED,
  COLS,
  ROWS,
  FRAME_RATE
} from './config.js';
import { speedForLevel } from './speed.js';
import * as memory from './memory.js';
import {
  PRESSED,
  update as updateController,
  state as controller,
  RELEASED,
  needsRelease,
  bindSelector
} from './controller.js';
// import * as TESTS from './tests.js';

const game = new Vue({
  el: '#controls',
  filters: {
    pad: s => s.toString().padStart(3, '0'),
    round: s => Math.round(s),
    toJSON: d => JSON.stringify(d, 0, 2)
  },
  data: {
    settings: {
      layout: 1
    },
    ticks: {
      loop: 0,
      last: 0
    },
    pageId: 0,
    fps: 0,
    score: 0,
    speed: STARTING_SPEED,
    pages: memory.pages,
    debug: false,
    current: {},
    running: false,
    upAt: null,
    autorepeatY: 0,
    controls: {}
  },
  computed: {
    currentType: {
      get: function() {
        return this.current.name;
      },
      set(value) {
        game.next = new Tet(value);
        makeNewBlock();
      }
    }
  },
  mounted() {
    bindSelector('left', '.left');
    bindSelector('right', '.right');
    bindSelector('down', '.down');
    bindSelector('a', '.rotate');
    bindSelector('b', '.rotate-anti');
    try {
      const searchParams = new URLSearchParams(window.location.search);
      let layout = searchParams.get('layout');
      if (layout) {
        layout = parseInt(layout || this.settings.layout, 10);
        localStorage.setItem('layout', layout);
      } else {
        layout = parseInt(
          localStorage.getItem('layout') || this.settings.layout,
          10
        );
      }
      this.settings.layout = layout;
    } catch (e) {
      // noop
    }
    document.documentElement.className = `layout-${this.settings.layout}`;
  },
  methods: {
    runningChange() {
      this.pageId = memory.pages.length - 1;
      memory.memory.set(memory.pages[this.pageId], 0);
      if (this.running) loop();
    },
    pageChange() {
      memory.memory.set(memory.pages[this.pageId], 0);
      drawMemory();
    },
    cancelInput(dir) {
      this.upAt = Date.now();
      setTimeout(() => cancelAction(dir), FRAME_RATE * 10); // aim to clear the state in the next move frame
    },
    input(dir, e) {
      // prevent click from firing straight after a touch event
      if (e.type === 'click') {
        if (Date.now() - 10 <= this.upAt) {
          return;
        }

        this.cancelInput(dir);
      }

      document.body.dataset.input = 'mouse';

      if (dir === 'rotate') {
        return rotate(true);
      }

      if (dir === 'rotate-anti') {
        return rotate(false);
      }

      action(dir);

      e.target.blur();
    }
  }
});

function reset() {
  game.running = true;
  game.speed = STARTING_SPEED;
  game.ticks = { loop: 0, move: 0, last: 0 };
  game.score = 0;
}

function updateSpeed() {
  const level = (game.score / 10) | 0;
  game.speed = speedForLevel(level);

  // game.speed = (10 - ((game.score / 10) | 0)) * 0.05 * 1000;
}

function drawMemory() {
  // eslint-disable-next-line no-self-assign
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

function tetrominoToCTX({ brick, ctx }) {
  ctx.canvas.width = BRICK_SIZE * brick.w;
  ctx.canvas.height = BRICK_SIZE * brick.h;
  ctx.fillStyle = 'white';

  brick.shape.map((e, i) => {
    if (e) {
      const x = BRICK_SIZE * (i % brick.w);
      const y = BRICK_SIZE * ((i / brick.w) | 0);
      ctx.rect(x, y, BRICK_SIZE, BRICK_SIZE);
    }
  });

  ctx.fill();
}

function drawNext() {
  const prev = document.querySelector('#next');
  if (prev) prev.remove();
  tetrominoToCTX({
    ctx: makeCanvas('next', document.querySelector('#controls')),
    brick: game.next
  });
}

function renderTetromino(brick) {
  drawMemory();

  const prev = document.querySelector('#brick');
  if (prev) prev.remove();
  const c = makeCanvas('brick');

  c.canvas.hidden = true;
  c.canvas.className = 'debug';

  tetrominoToCTX({ ctx: c, brick });

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
  game.running = false;
  memory.write(game.current);

  const lines = memory.checkForLines();

  if (lines.length) {
    await Promise.all(
      lines.map((y, i) => {
        memory.removeLine(y + i);
        return flashLine(y); // note that flashing is done on printed lines and not memory
      })
    );
    game.score += lines.length;
    updateSpeed();
  }

  game.running = true;
  loop();

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

  gameOverText();
}

function gameOverText() {
  game.ctx.globalCompositeOperation = 'xor';
  game.ctx.font = '4vh monospace';
  game.ctx.fillText(
    'GAME OVER',
    BRICK_SIZE * COLS * 0.15,
    (ROWS * BRICK_SIZE) / 2
  );
  game.ctx.globalCompositeOperation = 'source-over';
}

function gameOver() {
  game.running = false; // game over
  setInterval(() => {
    drawMemory();
    gameOverText();
    setTimeout(glitch, randInt(250, 1000));
  }, 500);
}

function makeNewBlock() {
  game.autorepeatY = 0; // initial drop delay
  if (controller.down) {
    needsRelease('down');
  }
  game.current = game.next || new Tet();
  game.next = new Tet();

  game.controls.drop = false;

  drawNext();

  if (!memory.isFree(game.current)) {
    return gameOver();
  }
  renderTetromino(game.current);
  game.current.handlers.draw = () => {
    if (game.running) renderTetromino(game.current);
  };
  game.current.handlers.stop = stop;
}

function rotate(clockwise) {
  if (game.running) {
    game.current.rotate(!clockwise);
  }
}

function action(type) {
  // ensures all user actions go through the game running test.
  // this is a bit lazy, but it works.
  if (game.running && !game.controls.down) {
    game.controls[type] = true;
    game.controls.todo = type;
  }
}

function cancelAction(type) {
  game.controls.todo = null;
  game.controls.down = false;
  game.controls[type] = false;
}

function loop(delta) {
  if (game.running) {
    // run at 60fps, not faster
    if (delta - game.ticks.last > FRAME_RATE) {
      // check controls
      // 60 times per second - before the up occurs

      const lastState = { ...controller };
      updateController(delta);

      game.controls = controller;

      // TODO shift
      if (controller.left !== RELEASED) {
        if (controller.left > 16 && controller.left % 6 === 0) {
          game.current.left();
        }
      } else if (controller.right !== RELEASED) {
        if (controller.right > 16 && controller.right % 6 === 0) {
          game.current.right();
        }
      }

      if (controller.left === RELEASED) {
        if (lastState.left > RELEASED && lastState.left <= 16) {
          game.current.left();
        }
      }

      if (controller.right === RELEASED) {
        if (lastState.right > RELEASED && lastState.right <= 16) {
          game.current.right();
        }
      }

      // rotate
      if (controller.a === PRESSED || controller.b === PRESSED) {
        game.current.rotate(controller.b === PRESSED);
        needsRelease(controller.b === PRESSED ? 'b' : 'a');
      }

      // down is being held
      if (controller.left === RELEASED && controller.right === RELEASED) {
        if (controller.down !== RELEASED) {
          if (game.autorepeatY < 0) {
            game.autorepeatY = 0; // works (not sure if that's a forced down though)
          }

          if (game.autorepeatY === 0 && controller.down === 3) {
            game.autorepeatY = 1;
          } else {
            game.autorepeatY++;
          }
        }

        if (lastState.down > 0 && controller.down === RELEASED) {
          if (lastState.down < 3) {
            // down was pressed and released
            game.autorepeatY = 1;
          } else {
            game.autorepeatY = 0;
          }
        }
      }

      if (game.autorepeatY === 0) {
        // normal drop at game speed
        if (delta - game.ticks.loop > game.speed) {
          game.ticks.loop = delta;
          game.current.drop();
        }
      } else {
        // down is pressed
        if (
          (game.autorepeatY > 3 && controller.down % 2 === 0) ||
          game.autorepeatY === 3
        ) {
          console.log('soft drop');
          game.current.drop();
        }

        if (controller.down === RELEASED) {
          game.autorepeatY++;
        }
      }

      game.ticks.last = delta;
    }

    requestAnimationFrame(loop);
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

  const layout = game.settings.layout;
  document.querySelector('#touch-controls .left').style.height = `${ctx.canvas
    .offsetHeight + ctx.canvas.offsetTop}px`;
  if (layout === 1) {
    // do nothing
  } else if (layout === 2) {
    document.querySelector(
      '#touch-controls'
    ).style.gridTemplateColumns = `auto ${ctx.canvas.offsetWidth -
      BRICK_SIZE}px auto`;
  }

  window.addEventListener(
    'keydown',
    e => {
      if (e.which === 191) {
        // ?
        game.debug = !game.debug;
      }
    },
    false
  );

  // memory.loadMemory(TESTS.B.base);
  // game.next = new Tet(TESTS.B.next);

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
