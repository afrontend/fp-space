#!/usr/bin/env node
const clear = require("clear");
const keypress = require("keypress");
const { program } = require("commander");
const game = require("../lib/index.js");
const pkg = require("../package.json");
const chalk = require("chalk");

program
  .version(pkg.version)
  .option("-f, --full", "terminal full size")
  .parse(process.argv);

function getColorItem(item, char) {
  if (chalk[item.color]) {
    return chalk[item.color](char);
  }
  return chalk.blue(char);
}

const getMark = item => (game.isBlank(item) ? " " : getColorItem(item, "■"));

const format = ary =>
  ary.map(r => r.map(item => getMark(item)).join(" ")).join("\r\n");

const startGame = (rows = 15, columns = 15) => {
  const gameCtx = {
    state: game.init(rows, columns)
  };

  // Choose render strategy once based on --full flag
  const render = program.opts().full
    ? () => console.log(format(game.join(gameCtx.state)))
    : () => {
        clear();
        console.log(format(game.join(gameCtx.state)));
      };

  keypress(process.stdin);

  process.stdin.on("keypress", (ch, key) => {
    if (key && key.ctrl && key.name === "c") {
      process.exit();
    }
    if (key && key.name === "q") {
      process.exit();
    }
    if (key) {
      gameCtx.state = game.key(key.name, gameCtx.state);
      render();
    }
  });

  process.stdin.setRawMode(true);
  process.stdin.resume();

  gameCtx.timer = setInterval(() => {
    gameCtx.state = game.tick(gameCtx.state);
    render();
  }, 200);
};

const activate = () => {
  if (program.opts().full) {
    startGame(process.stdout.rows - 1, process.stdout.columns / 2 - 1);
  } else {
    startGame();
  }
};

activate();
