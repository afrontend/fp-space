const game = require("../index.js");

// ─── helpers ────────────────────────────────────────────────────────────────

/** Returns all row indices that contain at least one non-blank cell. */
function nonBlankRows(panel) {
  const rows = new Set();
  panel.forEach((row, r) => {
    if (row.some(item => !game.isBlank(item))) rows.add(r);
  });
  return [...rows].sort((a, b) => a - b);
}

/** Returns all column indices that contain at least one non-blank cell. */
function nonBlankCols(panel) {
  const cols = new Set();
  panel.forEach(row => {
    row.forEach((item, c) => {
      if (!game.isBlank(item)) cols.add(c);
    });
  });
  return [...cols].sort((a, b) => a - b);
}

/** Returns true if every cell in the panel is blank. */
const isBlankPanel = panel =>
  panel.every(row => row.every(item => game.isBlank(item)));

// ─── init ───────────────────────────────────────────────────────────────────

describe("init", () => {
  it("returns all three panels", () => {
    const state = game.init();
    expect(state.missilePanel).toBeDefined();
    expect(state.shuttlePanel).toBeDefined();
    expect(state.meteoritePanel).toBeDefined();
  });

  it("starts unpaused with tickCount 0", () => {
    const state = game.init();
    expect(state.paused).toBe(false);
    expect(state.tickCount).toBe(0);
  });

  it("missile panel starts empty", () => {
    const state = game.init();
    expect(isBlankPanel(state.missilePanel)).toBe(true);
  });

  it("shuttle panel has cells at the bottom", () => {
    const state = game.init(15, 15);
    const rows = nonBlankRows(state.shuttlePanel);
    expect(Math.max(...rows)).toBe(14); // bottom row is row 14 in a 15-row grid
  });

  it("meteorite panel has cells at the top", () => {
    const state = game.init(15, 15);
    const rows = nonBlankRows(state.meteoritePanel);
    expect(Math.min(...rows)).toBe(0);
  });

  it("respects custom size", () => {
    const state = game.init(10, 10);
    expect(state.missilePanel.length).toBe(10);
    expect(state.missilePanel[0].length).toBe(10);
  });

  it("returns independent states on repeated calls", () => {
    const a = game.init(15, 15);
    const b = game.init(15, 15);
    expect(a).not.toBe(b);
    expect(a.missilePanel).not.toBe(b.missilePanel);
  });
});

// ─── tick ───────────────────────────────────────────────────────────────────

describe("tick", () => {
  it("increments tickCount each call", () => {
    const s0 = game.init();
    const s1 = game.tick(s0);
    const s2 = game.tick(s1);
    expect(s1.tickCount).toBe(1);
    expect(s2.tickCount).toBe(2);
  });

  it("does nothing when paused", () => {
    const s0 = game.key("space", game.init());
    const s1 = game.tick(s0);
    expect(s1).toBe(s0); // same reference — nothing changed
  });

  it("moves missiles up each tick", () => {
    const s0 = game.key("up", game.init());
    const missileRowsBefore = nonBlankRows(s0.missilePanel);
    const s1 = game.tick(s0);
    const missileRowsAfter = nonBlankRows(s1.missilePanel);
    // Every missile row should have shifted up by 1 (lower index)
    missileRowsBefore.forEach((row, i) => {
      expect(missileRowsAfter[i]).toBe(row - 1);
    });
  });

  it("does not move meteorite on tick 1 or 2", () => {
    const s0 = game.init();
    const meteoriteRowsBefore = nonBlankRows(s0.meteoritePanel);
    const s1 = game.tick(s0); // tickCount = 1
    const s2 = game.tick(s1); // tickCount = 2
    expect(nonBlankRows(s1.meteoritePanel)).toEqual(meteoriteRowsBefore);
    expect(nonBlankRows(s2.meteoritePanel)).toEqual(meteoriteRowsBefore);
  });

  it("moves meteorite down on every 3rd tick", () => {
    let state = game.init();
    const meteoriteRowsBefore = nonBlankRows(state.meteoritePanel);
    state = game.tick(state); // 1
    state = game.tick(state); // 2
    state = game.tick(state); // 3 — meteorite moves down
    const meteoriteRowsAfter = nonBlankRows(state.meteoritePanel);
    meteoriteRowsBefore.forEach((row, i) => {
      expect(meteoriteRowsAfter[i]).toBe(row + 1);
    });
  });

  it("destroys overlapping missile and meteorite cells", () => {
    // Fire several missiles and tick until they reach the meteorite
    let state = game.init(15, 15);
    // Fire a burst of missiles
    for (let i = 0; i < 5; i++) {
      state = game.key("up", state);
    }
    // Tick until some missiles reach row 0 (where the meteorite starts)
    for (let i = 0; i < 14; i++) {
      state = game.tick(state);
    }
    // After enough ticks the meteorite row should have gaps (cells destroyed)
    const meteoriteCols = nonBlankCols(state.meteoritePanel);
    // The meteorite started with 13 cells; some should be gone
    expect(meteoriteCols.length).toBeLessThan(13);
  });

  it("spawns a new meteorite when all are destroyed", () => {
    // The meteorite starts at row 0. Fire many missiles from center and tick.
    let state = game.init(15, 15);
    for (let i = 0; i < 20; i++) {
      state = game.key("up", state);
      state = game.tick(state);
    }
    // After enough ticks and missiles the meteorite panel should never be
    // permanently blank — a new wave always spawns.
    expect(isBlankPanel(state.meteoritePanel)).toBe(false);
  });
});

// ─── key ────────────────────────────────────────────────────────────────────

describe("key('space')", () => {
  it("sets paused to true", () => {
    const state = game.key("space", game.init());
    expect(state.paused).toBe(true);
  });

  it("toggles paused back to false", () => {
    let state = game.init();
    state = game.key("space", state);
    state = game.key("space", state);
    expect(state.paused).toBe(false);
  });
});

describe("key('left') / key('right')", () => {
  it("moves the shuttle left", () => {
    const s0 = game.init(15, 15);
    const colsBefore = nonBlankCols(s0.shuttlePanel);
    const s1 = game.key("left", s0);
    const colsAfter = nonBlankCols(s1.shuttlePanel);
    expect(Math.min(...colsAfter)).toBe(Math.min(...colsBefore) - 1);
  });

  it("moves the shuttle right", () => {
    const s0 = game.init(15, 15);
    const colsBefore = nonBlankCols(s0.shuttlePanel);
    const s1 = game.key("right", s0);
    const colsAfter = nonBlankCols(s1.shuttlePanel);
    expect(Math.max(...colsAfter)).toBe(Math.max(...colsBefore) + 1);
  });

  it("does not move left when at the left edge", () => {
    let state = game.init(15, 15);
    // Move all the way left
    for (let i = 0; i < 15; i++) state = game.key("left", state);
    const colsAtEdge = nonBlankCols(state.shuttlePanel);
    state = game.key("left", state);
    expect(nonBlankCols(state.shuttlePanel)).toEqual(colsAtEdge);
  });

  it("does not move right when at the right edge", () => {
    let state = game.init(15, 15);
    for (let i = 0; i < 15; i++) state = game.key("right", state);
    const colsAtEdge = nonBlankCols(state.shuttlePanel);
    state = game.key("right", state);
    expect(nonBlankCols(state.shuttlePanel)).toEqual(colsAtEdge);
  });

  it("does not move when paused", () => {
    const s0 = game.init(15, 15);
    const colsBefore = nonBlankCols(s0.shuttlePanel);
    const paused = game.key("space", s0);
    const afterLeft = game.key("left", paused);
    const afterRight = game.key("right", paused);
    expect(nonBlankCols(afterLeft.shuttlePanel)).toEqual(colsBefore);
    expect(nonBlankCols(afterRight.shuttlePanel)).toEqual(colsBefore);
  });
});

describe("key('up')", () => {
  it("adds a missile to the missile panel", () => {
    const s0 = game.init();
    expect(isBlankPanel(s0.missilePanel)).toBe(true);
    const s1 = game.key("up", s0);
    expect(isBlankPanel(s1.missilePanel)).toBe(false);
  });

  it("does not fire when paused", () => {
    const s0 = game.key("space", game.init());
    const s1 = game.key("up", s0);
    expect(isBlankPanel(s1.missilePanel)).toBe(true);
  });
});

describe("key — unknown key", () => {
  it("returns state unchanged for unknown keys", () => {
    const state = game.init();
    expect(game.key("z", state)).toBe(state);
  });
});

// ─── join ────────────────────────────────────────────────────────────────────

describe("join", () => {
  it("returns a 2D array with correct dimensions", () => {
    const state = game.init(15, 15);
    const grid = game.join(state);
    expect(grid.length).toBe(15);
    expect(grid[0].length).toBe(15);
  });

  it("contains shuttle cells", () => {
    const state = game.init(15, 15);
    const grid = game.join(state);
    const hasShuttle = grid.some(row => row.some(item => !game.isBlank(item)));
    expect(hasShuttle).toBe(true);
  });

  it("reflects fired missiles after a tick moves them away from the shuttle", () => {
    const s0 = game.init();
    const s1 = game.tick(game.key("up", s0)); // missile moves up, away from shuttle
    const gridBefore = game.join(s0);
    const gridAfter = game.join(s1);
    const countNonBlank = grid =>
      grid.flat().filter(item => !game.isBlank(item)).length;
    expect(countNonBlank(gridAfter)).toBeGreaterThan(countNonBlank(gridBefore));
  });
});

// ─── isBlankItem ─────────────────────────────────────────────────────────────

describe("isBlankItem", () => {
  it("returns true for cells in an empty missile panel", () => {
    const state = game.init();
    expect(game.isBlank(state.missilePanel[0][0])).toBe(true);
  });

  it("returns false for shuttle cells", () => {
    const state = game.init(15, 15);
    const shuttleCell = state.shuttlePanel[14][7]; // center bottom row
    expect(game.isBlank(shuttleCell)).toBe(false);
  });
});
