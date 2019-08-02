export const controllers = {};

export function getState() {
  const res = [];
  const controllers = Array.from(navigator.getGamepads()).filter(Boolean);
  for (let j in controllers) {
    const controller = controllers[j];
    const state = {
      axes: {
        left: false,
        right: false,
        up: false,
        down: false
      },
      buttons: {
        a: false,
        b: false
      }
    };
    res.push(state);
    for (let i = 0; i < controller.buttons.length; i++) {
      let val = controller.buttons[i];
      let pressed = val == 1.0;
      if (typeof val == 'object') {
        pressed = val.pressed;
        val = val.value;
      }

      const pcent = Math.round(val * 100);
      state.buttons[i] = { value: val, pressed, pcent };

      if (i === 0) {
        state.buttons.a = pressed;
      }
      if (i === 1) {
        state.buttons.b = pressed;
      }
    }

    for (let i = 0; i < controller.axes.length; i++) {
      const n = controller.axes[i].toFixed(2);
      // 0 = h
      // 1 = v
      if (n < -0.5) {
        state.axes[i === 0 ? 'left' : 'up'] = true;
      }
      if (n > 0.5) {
        state.axes[i === 0 ? 'right' : 'down'] = true;
      }
    }
  }

  return res;
}

function connectHandler(event) {
  const { gamepad } = event;
  controllers[gamepad.index] = gamepad;
}

function disconnectHandler(event) {
  const { gamepad } = event;
  delete controllers[gamepad.index];
}

window.addEventListener('gamepadconnected', connectHandler);
window.addEventListener('gamepaddisconnected', disconnectHandler);
