const p = require("fp-panel");

const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((v, f) => f(v), x);

const trimEdges = (arr) => arr.slice(1, -1);

// Panel painters

const paintShuttle = (panel) =>
  p.paint(
    panel,
    [
      { row: 0, column: 1, zeroPoint: true },
      { row: 1, column: 0 },
      { row: 1, column: 1 },
      { row: 1, column: 2 },
    ],
    "magenta",
  );

const makeMeteoriteShape = (panel) =>
  panel[0].map((value, index) => ({ row: 0, column: index, zeroPoint: true }));

const paintMeteorite = (panel) =>
  p.paint(panel, trimEdges(makeMeteoriteShape(panel)), "blue");

// Panel factories — dimensions are passed explicitly; no module-level state.

const createEmptyPanel = (rows, cols) => p.createPanel(rows, cols);

const createShuttlePanel = (rows, cols) =>
  pipe(
    paintShuttle,
    p.adjustToCenter,
    p.adjustToBottom,
  )(createEmptyPanel(rows, cols));

const createMeteoritePanel = (rows, cols) =>
  pipe(paintMeteorite, p.adjustToRandomCenter)(createEmptyPanel(rows, cols));

// Missile

const addMissile = (missilePanel, shuttlePanel) =>
  p.paint(
    missilePanel,
    p.getZeroPoints(shuttlePanel).map((point) => ({
      ...point,
      zeroPoint: true,
    })),
    "yellow",
  );

// Movement

const upMissile = (state) => ({
  ...state,
  missilePanel: p.up(state.missilePanel),
});

const downMeteorite = (state) => ({
  ...state,
  meteoritePanel: p.down(state.meteoritePanel),
});

// Collision: overlapping missile and meteorite cells cancel each other out.
// If all meteorites are destroyed, a new wave spawns.

const resolveCollision = (state) => ({
  ...state,
  missilePanel: p.sub(state.missilePanel, state.meteoritePanel),
  meteoritePanel: p.sub(state.meteoritePanel, state.missilePanel),
});

const respawnMeteoriteIfNeeded = (state) => ({
  ...state,
  meteoritePanel: p.isBlankPanel(state.meteoritePanel)
    ? createMeteoritePanel(state.rows, state.columns)
    : state.meteoritePanel,
});

const checkCollision = pipe(resolveCollision, respawnMeteoriteIfNeeded);

// Key handlers

const leftKey = (state) => {
  const blocked =
    p.isOnTheLeftEdge(state.shuttlePanel) ||
    p.isOverlap(p.left(state.shuttlePanel), state.meteoritePanel);
  return blocked
    ? state
    : { ...state, shuttlePanel: p.left(state.shuttlePanel) };
};

const rightKey = (state) => {
  const blocked =
    p.isOnTheRightEdge(state.shuttlePanel) ||
    p.isOverlap(p.right(state.shuttlePanel), state.meteoritePanel);
  return blocked
    ? state
    : { ...state, shuttlePanel: p.right(state.shuttlePanel) };
};

const upKey = (state) => ({
  ...state,
  missilePanel: addMissile(state.missilePanel, state.shuttlePanel),
});

const keyHandlers = {
  space: (state) => ({ ...state, paused: !state.paused }),
  left: (state) => (state.paused ? state : leftKey(state)),
  right: (state) => (state.paused ? state : rightKey(state)),
  up: (state) => (state.paused ? state : upKey(state)),
};

// Public API

const init = (rows = 15, columns = 15) => ({
  missilePanel: createEmptyPanel(rows, columns),
  shuttlePanel: createShuttlePanel(rows, columns),
  meteoritePanel: createMeteoritePanel(rows, columns),
  paused: false,
  tickCount: 0,
  rows,
  columns,
});

// Each tick: missiles move up. Every 3rd tick, the meteorite also moves down.
const tick = (state) => {
  if (state.paused) return state;
  const tickCount = state.tickCount + 1;
  const moved =
    tickCount % 3 === 0 ? downMeteorite(upMissile(state)) : upMissile(state);
  return { ...checkCollision(moved), tickCount };
};

const key = (keyName, state) =>
  keyHandlers[keyName] ? keyHandlers[keyName](state) : state;

const join = (state) =>
  p.add([state.missilePanel, state.shuttlePanel, state.meteoritePanel]);

module.exports = {
  init,
  tick,
  key,
  join,
  isBlank: p.isBlankItem,
};
