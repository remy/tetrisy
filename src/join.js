import io from './vendor/socket.io.slim.js';
import * as memory from './memory.js';
import { setSeed } from './random.js';

let socket = null;

const WAITING = 0;
const SENT_ACK = 1;
const READY = 2;
const JOINED = 4;

export default (token, ready) => {
  let state = WAITING;
  let latency = -1;
  let seed = null;
  let player = 0;

  socket = io.exports('https://sockets.isthe.link', {
    query: {
      token
    }
  });

  let win = () => {};

  const run = () => {
    setSeed(seed);
    console.log('setting seed: %s', seed);

    state = JOINED;
    ready({
      player,
      onWin: callback => (win = callback),
      gameOver: () => {
        socket.send({ type: 'gameOver' });
      },
      lines: lines => {
        const time = Date.now();
        socket.send({ type: 'lines', lines, time });
      }
    });
  };

  socket.on('message', data => {
    const { type } = data;
    const time = Date.now();
    console.log('in', { myState: state, latency: time - data.time }, data);

    if (type === 'join' && state !== JOINED) {
      if (data.state === WAITING) {
        player = 1;
        latency = time - data.time;
        state = SENT_ACK;
        socket.send({ type: 'join', time, state, latency });
      }

      if (data.state === SENT_ACK) {
        player = 2;
        latency = data.latency;
        state = READY;
        seed = time;
        socket.send({ type: 'join', time, state, latency, seed });
        run();
      }

      if (data.state === READY) {
        state = READY;
        seed = data.seed;
        run();
      }
    }

    if (type === 'gameOver') {
      // we won
      win();
    }

    if (type === 'lines') {
      memory.appendLines(data.lines);
    }
  });

  socket.send({ type: 'join', state, time: Date.now(), latency });
};
