import { speedForLevel } from './speed.js';

export const ROWS = 20;
export const COLS = 10;
export const STARTING_SPEED = speedForLevel(0);
export const BRICK_SIZE = ((window.innerHeight / ROWS) * 0.6) | 0;
export const FRAME_RATE = 16; // 1000ms / 60fps = ~16ms