import * as gamepad from './gamepad.js';

export const RELEASED = -1;
export const PRESSED = 1;

const waitingRelease = {};

const manualState = {};

export function isPressed(button) {
  return state[button] > RELEASED;
}

export function needsRelease(button) {
  waitingRelease[button] = true;
  state[button] = RELEASED;
}

export const state = {
  a: RELEASED,
  b: RELEASED,
  left: RELEASED,
  right: RELEASED,
  down: RELEASED
};

function updateButtonState(button, pressed) {
  if (!pressed) {
    state[button] = RELEASED;
    if (waitingRelease[button]) {
      delete waitingRelease[button];
    }
    return;
  }

  if (waitingRelease[button]) {
    state[button] = RELEASED;
    return;
  }

  if (state[button] === RELEASED) {
    state[button] = PRESSED;
    return;
  }

  state[button]++;
}

function readFromKeys() {
  for (let button of ['left', 'right', 'down', 'a', 'b']) {
    updateButtonState(button, manualState[button]);
  }
}

function readFromController(c) {
  for (let button of ['left', 'right', 'down']) {
    updateButtonState(button, c.axes[button]);
  }

  for (let button of ['a', 'b']) {
    updateButtonState(button, c.buttons[button]);
  }
}

function handleKeys(e) {
  const pressed = e.type === 'keydown';
  let key = null;

  if (e.code === 'Space' || e.code === 'KeyA' || e.code === 'KeyB') {
    key = e.code === 'KeyB' ? 'b' : 'a';
  }

  if (e.code === 'ArrowLeft') {
    key = 'left';
  }

  if (e.code === 'ArrowDown') {
    key = 'down';
  }

  if (e.code === 'ArrowRight') {
    key = 'right';
  }

  if (key) {
    manualState[key] = pressed;
  }
}

window.addEventListener('keydown', handleKeys, false);
window.addEventListener('keyup', handleKeys, false);

export function bindSelector(key, selector) {
  const el = document.querySelector(selector);

  const listener = e => {
    let pressed = false;
    if (e.type.startsWith('mouse')) {
      pressed = e.type === 'mousedown';
    } else {
      // touch
      pressed = e.type === 'touchstart';
    }
    manualState[key] = pressed;
  };

  el.addEventListener('touchstart', listener, false);
  el.addEventListener('touchend', listener, false);
  el.addEventListener('touchcancel', listener, false);
  el.addEventListener('mousedown', listener, false);
  el.addEventListener('mouseup', listener, false);
}

export function update() {
  // check gamepad first
  const controller = gamepad.getState()[0];
  if (controller) {
    readFromController(controller);
    return;
  } else {
    readFromKeys();
  }
}
