const p = require("fp-panel");

const pipe =
  (...fns) =>
  (x) =>
    fns.reduce((v, f) => f(v), x);

const GAME_ID = "fp-space";
const SNAPSHOT_VERSION = 1;
const MAX_DIMENSION = 500;

const normalizeDimension = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(Math.max(1, Math.trunc(number)), MAX_DIMENSION)
    : fallback;
};

const isPaused = (state) => (state.paused ?? state.pause) === true;
const withPaused = (state, paused) => ({ ...state, paused, pause: paused });

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
  rows < 2 || cols < 3
    ? createEmptyPanel(rows, cols)
    : pipe(
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
  space: (state) => withPaused(state, !isPaused(state)),
  left: (state) => (isPaused(state) ? state : leftKey(state)),
  right: (state) => (isPaused(state) ? state : rightKey(state)),
  up: (state) => (isPaused(state) ? state : upKey(state)),
};

// Public API

const init = (options = {}, legacyColumns) => {
  const normalizedOptions =
    typeof options === "number"
      ? { rows: options, columns: legacyColumns }
      : (options ?? {});
  const rows = normalizeDimension(normalizedOptions.rows ?? 15, 15);
  const columns = normalizeDimension(normalizedOptions.columns ?? 15, 15);
  return {
    missilePanel: createEmptyPanel(rows, columns),
    shuttlePanel: createShuttlePanel(rows, columns),
    meteoritePanel: createMeteoritePanel(rows, columns),
    paused: false,
    pause: false,
    tickCount: 0,
    rows,
    columns,
  };
};

// Each tick: missiles move up. Every 3rd tick, the meteorite also moves down.
const tick = (state) => {
  if (isPaused(state)) return state;
  const tickCount = state.tickCount + 1;
  const moved =
    tickCount % 3 === 0 ? downMeteorite(upMissile(state)) : upMissile(state);
  return { ...checkCollision(moved), tickCount };
};

const key = (keyName, state) =>
  keyHandlers[keyName] ? keyHandlers[keyName](state) : state;

const join = (state) =>
  p.add([state.missilePanel, state.shuttlePanel, state.meteoritePanel]);

const toArray = ({ missilePanel, shuttlePanel, meteoritePanel }) => [
  structuredClone(missilePanel),
  structuredClone(shuttlePanel),
  structuredClone(meteoritePanel),
];

const getTickInterval = () => 200;

const serializeState = (state) => ({
  game: GAME_ID,
  version: SNAPSHOT_VERSION,
  state: structuredClone(state),
});

const restoreState = (snapshot) => {
  if (!snapshot || snapshot.game !== GAME_ID) {
    throw new TypeError("fp-space 스냅숏이 아닙니다.");
  }
  if (snapshot.version !== SNAPSHOT_VERSION) {
    throw new RangeError(`지원하지 않는 스냅숏 버전: ${snapshot.version}`);
  }
  const restored = structuredClone(snapshot.state);
  if (
    !restored?.missilePanel ||
    !restored?.shuttlePanel ||
    !restored?.meteoritePanel
  ) {
    throw new TypeError("스냅숏에 필수 패널이 없습니다.");
  }
  const rows = normalizeDimension(
    restored.rows ?? restored.missilePanel.length,
    15,
  );
  const columns = normalizeDimension(
    restored.columns ?? restored.missilePanel[0]?.length,
    15,
  );
  const paused = isPaused(restored);
  return {
    ...restored,
    rows,
    columns,
    paused,
    pause: paused,
    tickCount: restored.tickCount ?? 0,
  };
};

module.exports = {
  init,
  tick,
  key,
  join,
  isBlank: p.isBlankItem,
  toArray,
  getTickInterval,
  serializeState,
  restoreState,
};
