#!/usr/bin/env node
"use strict";

const clear = require("clear");
const chalk = require("chalk");
const game = require("../lib/index.js");

const ROWS = 15;
const COLS = 15;
const TICK_INTERVAL_MS = 200;
const MAX_TICKS = 250;

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

function getShuttleCol(panel) {
  // Find leftmost non-blank column in bottom two rows
  for (let r = ROWS - 1; r >= ROWS - 2; r--) {
    for (let c = 0; c < COLS; c++) {
      if (!game.isBlankItem(panel[r][c])) return c + 1; // center offset
    }
  }
  return Math.floor(COLS / 2);
}

// Patrol: shuttle sweeps left → right → left across the board
// Target columns cycle: 2, 5, 8, 11, 12, 9, 6, 3, 2, ...
const PATROL_TARGETS = [2, 5, 9, 12, 9, 5, 2];
let patrolIdx = 0;
let patrolStepCount = 0;
const PATROL_STEPS = 10; // ticks before moving to next patrol target

// Shoot every SHOOT_EVERY ticks (not every tick → avoids laser look)
const SHOOT_EVERY = 4;

let state = game.init(ROWS, COLS);
let ticks = 0;

const timer = setInterval(() => {
  const shuttleCol = getShuttleCol(state.shuttlePanel);

  // Update patrol target every PATROL_STEPS ticks
  patrolStepCount++;
  if (patrolStepCount >= PATROL_STEPS) {
    patrolStepCount = 0;
    patrolIdx = (patrolIdx + 1) % PATROL_TARGETS.length;
  }

  const targetCol = PATROL_TARGETS[patrolIdx];
  const diff = targetCol - shuttleCol;

  let keyName;
  if (ticks % SHOOT_EVERY === 0) {
    // Shoot periodically
    keyName = "up";
  } else if (diff > 0) {
    keyName = "right";
  } else if (diff < 0) {
    keyName = "left";
  } else {
    keyName = "up"; // at target, shoot
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
