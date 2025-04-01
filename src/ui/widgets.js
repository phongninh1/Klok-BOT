const blessed = require("blessed");
const contrib = require("blessed-contrib");
const { setLogBoxes } = require("../utils/logger") || {};
const widgets = {};


function createWidgets(grid, startRow = 2) {
  widgets.logBox = grid.set(startRow, 0, 10, 6, contrib.log, {
    fg: "green",
    label: "Log",
    tags: true,
    wrap: true,            
    scrollable: true,      
    alwaysScroll: true,   
    scrollbar: { ch: ' ' } 
  });
  

  widgets.chatBox = grid.set(startRow, 6, 10, 6, contrib.log, {
    fg: "white",
    label: "Chat History",
    tags: true,
    wrap: true,         
    scrollable: true,    
    alwaysScroll: true,  
    scrollbar: { ch: ' ' }
  });

  widgets.statusBox = grid.set(startRow + 10, 0, 2, 12, blessed.box, {
    label: "Status",
    content: "{center}Initializing...{/center}",
    tags: true,
    border: { type: "line" },
    style: {
      fg: "yellow",
      border: { fg: "white" },
    },
  });

  if (typeof setLogBoxes === "function") {
    setLogBoxes(widgets.logBox, widgets.chatBox);
  }

  return widgets;
}

function updatePointsDisplay() {
  // no-op
}

function updateModelsTable() {
  // no-op
}

/**
 * @param {string} status
 * @param {string} type
 */
function updateStatus(status, type = "info") {
  if (!widgets.statusBox) return;

  const colorMap = {
    info: "white",
    success: "green",
    warning: "yellow",
    error: "red",
  };
  const color = colorMap[type] || "white";

  widgets.statusBox.setContent(`{center}{${color}-fg}${status}{/${color}-fg}{/center}`);
  widgets.statusBox.screen.render();
}

function startCooldownDisplay(seconds, onUpdate) {
  updateStatus(`Cooldown: ${seconds}s`, "warning");

  let remaining = seconds;
  const interval = setInterval(() => {
    remaining--;
    updateStatus(`Cooldown: ${remaining}s`, "warning");
    if (onUpdate && typeof onUpdate === "function") {
      onUpdate(remaining);
    }
    if (remaining <= 0) {
      clearInterval(interval);
      updateStatus("Ready", "success");
    }
  }, 1000);

  return interval;
}

module.exports = {
  createWidgets,
  updatePointsDisplay,
  updateModelsTable,
  updateStatus,
  startCooldownDisplay,
  widgets,
};
