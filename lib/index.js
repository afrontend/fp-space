const _ = require("lodash");
const p = require("fp-panel");

// Panel size is set during init() and reused by panel factories.
let panelRows = 15;
let panelCols = 15;

const createEmptyPanel = () => p.createPanel(panelRows, panelCols);

// Panel painters

const paintShuttle = panel =>
  p.paint(
    panel,
    [
      { row: 0, column: 1, zeroPoint: true },
      { row: 1, column: 0 },
      { row: 1, column: 1 },
      { row: 1, column: 2 }
    ],
    "magenta"
  );

const makeMeteoriteShape = panel =>
  panel[0].map((value, index) => ({ row: 0, column: index, zeroPoint: true }));

const paintMeteorite = panel =>
  p.paint(panel, _.tail(_.initial(makeMeteoriteShape(panel))), "blue");

// Panel factories

const createShuttlePanel = () =>
  _.flow([paintShuttle, p.adjustToCenter, p.adjustToBottom])(
    createEmptyPanel()
  );

const createMeteoritePanel = () =>
  _.flow([paintMeteorite, p.adjustToRandomCenter])(createEmptyPanel());

// Missile

const addMissile = (missilePanel, shuttlePanel) =>
  p.paint(
    missilePanel,
    _.map(p.getZeroPoints(shuttlePanel), point => ({
      ...point,
      zeroPoint: true
    })),
    "yellow"
  );

// Movement

const upMissile = state => ({
  ...state,
  missilePanel: p.up(state.missilePanel)
});

const downMeteorite = state => ({
  ...state,
  meteoritePanel: p.down(state.meteoritePanel)
});

// Collision: overlapping missile and meteorite cells cancel each other out.
// If all meteorites are destroyed, a new wave spawns.

const resolveCollision = state => ({
  ...state,
  missilePanel: p.sub(state.missilePanel, state.meteoritePanel),
  meteoritePanel: p.sub(state.meteoritePanel, state.missilePanel)
});

const respawnMeteoriteIfNeeded = state => ({
  ...state,
  meteoritePanel: p.isBlankPanel(state.meteoritePanel)
    ? createMeteoritePanel()
    : state.meteoritePanel
});

const checkCollision = _.flow([resolveCollision, respawnMeteoriteIfNeeded]);

// Key handlers

const leftKey = state => {
  const blocked =
    p.isOnTheLeftEdge(state.shuttlePanel) ||
    p.isOverlap(p.left(state.shuttlePanel), state.meteoritePanel);
  return blocked
    ? state
    : { ...state, shuttlePanel: p.left(state.shuttlePanel) };
};

const rightKey = state => {
  const blocked =
    p.isOnTheRightEdge(state.shuttlePanel) ||
    p.isOverlap(p.right(state.shuttlePanel), state.meteoritePanel);
  return blocked
    ? state
    : { ...state, shuttlePanel: p.right(state.shuttlePanel) };
};

const upKey = state => ({
  ...state,
  missilePanel: addMissile(state.missilePanel, state.shuttlePanel)
});

const keyHandlers = {
  space: state => ({ ...state, paused: !state.paused }),
  left: state => (state.paused ? state : leftKey(state)),
  right: state => (state.paused ? state : rightKey(state)),
  up: state => (state.paused ? state : upKey(state))
};

// Public API

const init = (rows = 15, columns = 15) => {
  panelRows = rows;
  panelCols = columns;
  return {
    missilePanel: createEmptyPanel(),
    shuttlePanel: createShuttlePanel(),
    meteoritePanel: createMeteoritePanel(),
    paused: false,
    tickCount: 0
  };
};

// Each tick: missiles move up. Every 3rd tick, the meteorite also moves down.
const tick = state => {
  if (state.paused) return state;
  const tickCount = state.tickCount + 1;
  const moved =
    tickCount % 3 === 0 ? downMeteorite(upMissile(state)) : upMissile(state);
  return { ...checkCollision(moved), tickCount };
};

const key = (keyName, state) =>
  keyHandlers[keyName] ? keyHandlers[keyName](state) : state;

const join = state =>
  p.add([state.missilePanel, state.shuttlePanel, state.meteoritePanel]);

module.exports = {
  init,
  tick,
  key,
  join,
  isBlank: p.isBlankItem
};
