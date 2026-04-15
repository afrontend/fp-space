#!/usr/bin/env node
"use strict";

const clear = require("clear");
const chalk = require("chalk");
const game = require("../lib/index.js");

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
  if (chalk[item.color]) {
    return chalk[item.color](char);
  }
  return chalk.blue(char);
}

const getMark = item =>
  game.isBlankItem(item) ? "  " : getColorItem(item, "■ ");

const render = state =>
  game
    .join(state)
    .map(row => row.map(getMark).join(""))
    .join("\n");

/** Returns the center column of the shuttle by averaging all non-blank columns. */
function getShuttleCenter(panel) {
  const cols = [];
  panel.forEach(row => {
    row.forEach((item, c) => {
      if (!game.isBlankItem(item)) cols.push(c);
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
