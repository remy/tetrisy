import Vue from './vendor/vue.js';
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
  bindSelector,
  isPressed
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
    linesToInsert: 1,
    fps: 0,
    score: 0,
    multi: false,
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

      const room = searchParams.get('join');
      if (room) {
        import('./join.js').then(module => {
          /* waiting logic */
          game.running = false;
          game.score = !isNaN(parseInt(room, 10))
            ? room
            : (Math.random() * 999) | 0;
          game.current = new Tet('T');
          game.current.y = ((ROWS / 2) | 0) - 2;
          const timer = setInterval(() => {
            game.current.rotate(true);
            renderTetromino(game.current);
          }, 200);
          /* end waiting logic */

          module.default(game.score, methods => {
            this.multi = methods;
            methods.onWin(() => {
              if (game.running) gameOver('YOU WIN!');
            });
            game.next = null;
            clearInterval(timer);
            setup();
          });
        });
      }
    } catch (e) {
      // noop
    }
    document.documentElement.className = `layout-${this.settings.layout}`;
  },
  methods: {
    restart() {
      setup();
    },
    insertLines() {
      memory.appendLines(this.linesToInsert);
    },
    runningChange() {
      this.pageId = memory.pages.length - 1;
      memory.memory.set(memory.pages[this.pageId], 0);
      if (this.running) loop();
    },
    pageChange() {
      memory.memory.set(memory.pages[this.pageId], 0);
      drawMemory();
    }
  }
});

function reset() {
  game.running = true;
  game.speed = STARTING_SPEED;
  game.ticks = { loop: 0, last: 0 };
  game.score = 0;
  memory.reset();
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

  if (controller.down !== RELEASED) {
    needsRelease('down');
  }
  // game.autorepeatY = 0;

  const lines = memory.checkForLines();

  if (lines.length) {
    if (game.multi) {
      game.multi.lines(lines.length);
    }
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
  // debugger;
  makeNewBlock();
  loop();
}

const randInt = (a, b) => ~~(Math.random() * (b - a) + a);

function glitch(text) {
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

  gameOverText(text);
}

function gameOverText(text = 'GAME OVER') {
  game.ctx.globalCompositeOperation = 'xor';
  game.ctx.font = '4vh monospace';
  game.ctx.fillText(text, BRICK_SIZE * COLS * 0.15, (ROWS * BRICK_SIZE) / 2);
  game.ctx.globalCompositeOperation = 'source-over';
}

function gameOver(text) {
  game.running = false; // game over
  if (game.multi) {
    game.multi.gameOver();
  }
  setInterval(() => {
    drawMemory();
    gameOverText(text);
    setTimeout(() => glitch(text), randInt(250, 1000));
  }, 500);
}

function makeNewBlock() {
  game.autorepeatY = -1; // initial drop delay (not 100% sure why -1, but if it's zero, it blows up)
  game.current = game.next || new Tet();
  game.next = new Tet();

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
        if (isPressed('down')) {
          if (
            (game.autorepeatY > 3 && controller.down % 2 === 0) ||
            game.autorepeatY === 3
          ) {
            game.current.drop();
          }
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
    _.parentNode.removeChild(_);
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

  // memory.loadMemory(TESTS.A.base);
  // game.next = new Tet(TESTS.B.next);

  makeNewBlock();
  requestAnimationFrame(loop);
}

function test(t = 'L') {
  renderTetromino(new Tet(t));
}

window.addEventListener(
  'keydown',
  e => {
    if (e.which === 191) {
      game.debug = !game.debug;
    }
  },
  false
);

setup();

window.setup = setup;
window.game = game;
window.test = test;
window.memory = memory;
window.drawMemory = drawMemory;
window.render = () => renderTetromino(game.current);
