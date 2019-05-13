const _ = require("lodash");
const p = require("fp-panel");

// Configuration

const GLOBAL = {
  pause: false
};

// Pause panel

const isPaused = () => GLOBAL.pause === true;

const paintShuttle = panel =>
  p.paint(
    panel,
    [
      { row: 0, column: 1, zeroPoint: true },
      { row: 1, column: 0 },
      { row: 1, column: 1 },
      { row: 1, column: 2 }
    ],
    "pink"
  );

const makeMeteoriteShape = panel => {
  return panel[0].map((value, index) => {
    return { row: 0, column: index, zeroPoint: true };
  });
};

const paintMeteorite = panel =>
  p.paint(panel, makeMeteoriteShape(panel), "blue");

const createPanel = (() => {
  let savedRows = 0;
  let savedColumns = 0;
  return (rows, columns) => {
    savedRows = rows ? rows : savedRows;
    savedColumns = columns ? columns : savedColumns;
    return p.createPanel(savedRows, savedColumns);
  };
})();

// Create panel

const createShuttlePanel = _.flow([
  createPanel,
  paintShuttle,
  p.adjustToCenter,
  p.adjustToBottom
]);

const createMeteoritePanel = _.flow([
  createPanel,
  paintMeteorite,
  p.adjustToRandomCenter
]);

// Make tool panel

const addMissile = (missilePanel, shuttlePanel) =>
  p.paint(
    missilePanel,
    _.map(p.getZeroPoints(shuttlePanel), point => {
      point.zeroPoint = true;
      return point;
    }),
    "yellow"
  );

// Process event

const spaceKey = state => {
  GLOBAL.pause = !isPaused();
  return state;
};

const leftKey = ({ missilePanel, shuttlePanel, meteoritePanel }) => {
  const overlap =
    p.isOnTheLeftEdge(shuttlePanel) ||
    p.isOverlap(p.left(shuttlePanel), meteoritePanel);
  return {
    missilePanel,
    shuttlePanel: overlap ? shuttlePanel : p.left(shuttlePanel),
    meteoritePanel
  };
};

const upKey = ({ missilePanel, shuttlePanel, meteoritePanel }) => {
  return {
    missilePanel: addMissile(missilePanel, shuttlePanel),
    shuttlePanel,
    meteoritePanel
  };
};

const rightKey = ({ missilePanel, shuttlePanel, meteoritePanel }) => {
  const overlap =
    p.isOnTheRightEdge(shuttlePanel) ||
    p.isOverlap(p.right(shuttlePanel), meteoritePanel);
  return {
    missilePanel,
    shuttlePanel: overlap ? shuttlePanel : p.right(shuttlePanel),
    meteoritePanel
  };
};

// Key definition

const withPauseKey = fn => panels => (isPaused() ? panels : fn(panels));

const shuttleKeyFnList = [
  { key: "space", fn: spaceKey },
  { key: "left", fn: withPauseKey(leftKey) },
  { key: "right", fn: withPauseKey(rightKey) },
  { key: "up", fn: withPauseKey(upKey) }
];

const isValidKey = (key, fnList) =>
  _.some(fnList, item => _.isEqual(item.key, key));

const init = (rows = 15, columns = 15) => ({
  missilePanel: createPanel(rows, columns),
  shuttlePanel: createShuttlePanel(),
  meteoritePanel: createMeteoritePanel()
});

const checkMeteoritePanel = ({
  missilePanel,
  shuttlePanel,
  meteoritePanel
}) => ({
  missilePanel,
  shuttlePanel,
  meteoritePanel: p.isBlankPanel(meteoritePanel)
    ? createMeteoritePanel()
    : meteoritePanel
});

const diff = ({ missilePanel, shuttlePanel, meteoritePanel }) => {
  const newMissilePanel = p.sub(missilePanel, meteoritePanel);
  const newMeteoritePanel = p.sub(meteoritePanel, missilePanel);
  return {
    missilePanel: newMissilePanel,
    shuttlePanel,
    meteoritePanel: newMeteoritePanel
  };
};

const checkCollision = _.flow([diff, checkMeteoritePanel]);

const upMissile = state => ({
  missilePanel: p.up(state.missilePanel),
  shuttlePanel: state.shuttlePanel,
  meteoritePanel: state.meteoritePanel
});

const downMeteorite = state => ({
  missilePanel: state.missilePanel,
  shuttlePanel: state.shuttlePanel,
  meteoritePanel: p.down(state.meteoritePanel)
});

const makeTickFn = () => {
  let div = 0;
  return state => {
    div++;
    return isPaused()
      ? state
      : div % 3 === 0
      ? checkCollision(downMeteorite(upMissile(state)))
      : checkCollision(upMissile(state));
  };
};

const tick = makeTickFn();

const key = (key, state) =>
  isValidKey(key, shuttleKeyFnList)
    ? _.find(shuttleKeyFnList, item => _.isEqual(item.key, key)).fn(state)
    : state;

const join = state =>
  p.add([state.missilePanel, state.shuttlePanel, state.meteoritePanel]);

module.exports = {
  init,
  tick,
  key,
  join,
  isBlankItem: p.isBlankItem
};
