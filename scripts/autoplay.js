#!/usr/bin/env node
"use strict";

const { inspect, styleText } = require("node:util");
const game = require("../lib/index.js");

// 화면 지우기 + 커서를 맨 위로 (clear 패키지와 같은 시퀀스)
const clear = () => process.stdout.write("\x1b[2J\x1b[0f");

const ROWS = 15;
const COLS = 15;
const TICK_INTERVAL_MS = 200;
const MAX_TICKS = 250;

// Ticks before the patrol target advances to the next position
const PATROL_STEPS = 10;

// Fire a missile every N ticks (avoids continuous laser look)
const SHOOT_EVERY = 4;

// Shuttle sweeps left → center → right → center → left
const PATROL_TARGETS = [2, 5, 9, 12, 9, 5, 2];

function getColorItem(item, char) {
  // styleText 는 모르는 색 이름에 예외를 던지므로 없는 색(pink, orange 등)은 blue 로 그린다
  const color = Object.hasOwn(inspect.colors, item.color) ? item.color : "blue";
  return styleText(color, char);
}

const getMark = (item) =>
  game.isBlank(item) ? "  " : getColorItem(item, "■ ");

const render = (state) =>
  game
    .join(state)
    .map((row) => row.map(getMark).join(""))
    .join("\n");

/** Returns the center column of the shuttle by averaging all non-blank columns. */
function getShuttleCenter(panel) {
  const cols = [];
  panel.forEach((row) => {
    row.forEach((item, c) => {
      if (!game.isBlank(item)) cols.push(c);
    });
  });
  if (cols.length === 0) return Math.floor(COLS / 2);
  return Math.round(cols.reduce((a, b) => a + b, 0) / cols.length);
}

let state = game.init(ROWS, COLS);
let ticks = 0;
let patrolIdx = 0;
let patrolStepCount = 0;

const timer = setInterval(() => {
  const shuttleCenter = getShuttleCenter(state.shuttlePanel);

  patrolStepCount++;
  if (patrolStepCount >= PATROL_STEPS) {
    patrolStepCount = 0;
    patrolIdx = (patrolIdx + 1) % PATROL_TARGETS.length;
  }

  const targetCol = PATROL_TARGETS[patrolIdx];
  const diff = targetCol - shuttleCenter;

  let keyName;
  if (ticks % SHOOT_EVERY === 0) {
    keyName = "up";
  } else if (diff > 0) {
    keyName = "right";
  } else if (diff < 0) {
    keyName = "left";
  } else {
    keyName = "up"; // already at target — shoot
  }

  state = game.key(keyName, state);
  state = game.tick(state);

  clear();
  console.log(render(state));

  ticks++;
  if (ticks >= MAX_TICKS) {
    clearInterval(timer);
    process.exit(0);
  }
}, TICK_INTERVAL_MS);
