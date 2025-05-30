const blessed = require("blessed");
const contrib = require("blessed-contrib");
const { createWidgets, widgets, updateStatus } = require("./widgets");
const { log } = require("../utils");

let screen = null;

function initDashboard() {
  screen = blessed.screen({
    smartCSR: true,
    title: "KlokAI Chat Automation",
  });

  const grid = new contrib.grid({ rows: 14, cols: 12, screen: screen });

  const banner = grid.set(0, 0, 2, 12, blessed.box, {
    tags: true,
    content:
      "{center}{bold}Klok BOT{/bold}{/center}\n{center}Github: https://github.com/rpchubs | Telegram: https://t.me/RPC_Hubs{/center}",
    border: { type: "line" },
    style: { fg: "cyan", border: { fg: "blue" } },
  });

  createWidgets(grid, 2);

  setupKeyBindings();

  screen.render();
  log("KlokAI Chat Automation Dashboard initialized", "success");
  updateStatus("Ready to start", "info");

  return screen;
}

function setupKeyBindings() {
  screen.key(["escape", "q", "C-c"], () => process.exit(0));
}

function registerKeyHandler(key, handler) {
  if (!screen) throw new Error("Dashboard not initialized");
  screen.key(key, handler);
}

function render() {
  if (screen) screen.render();
}

module.exports = {
  initDashboard,
  registerKeyHandler,
  render,
  screen,
};
