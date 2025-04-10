const fs = require("fs");
const path = require("path");
const { authenticateAllWallets } = require("./src/api/signin");
const {
  initDashboard,
  registerKeyHandler,
  render,
  updateStatus,
  widgets,
} = require("./src/ui");
const {
  initAutomation,
  startAutomation,
  pauseAutomation,
  resumeAutomation,
  manualSwitchAccount,
  getRunningState,
} = require("./src/automation");
const { auth } = require("./src/api");
const {
  log,
  logToFile,
  checkLogSize,
  clearLogFile,
  backupLogFile,
} = require("./src/utils");

function readPrivateKeysFromFile(filePath) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`File ${absolutePath} not exists.`);
    return [];
  }
  const data = fs.readFileSync(absolutePath, "utf8");
  return data.split(/\r?\n/).filter(line => line.trim() !== "");
}

function clearSessionTokenFile() {
  const tokenPath = path.join(process.cwd(), "session-token.key");
  fs.writeFileSync(tokenPath, "", "utf8");
  console.log("[INFO] session-token.key has been cleared.");
}

async function main() {
  try {
    checkLogSize();

    initDashboard();

    clearSessionTokenFile();

    log("Welcome to KlokApp Chat Automation", "info");
    log("Press S to start, P to pause, R to resume, H for help", "info");
    logToFile("KlokApp Chat Automation started");

    const validTokenCount = await auth.verifyAndCleanupTokens();
    log(`Token Length: ${validTokenCount}`);

    if (validTokenCount === 0) {
      log("No valid session tokens found. Attempting to authenticate...", "info");
      updateStatus("Authenticating...", "info");
      render();

      const privateKeys = readPrivateKeysFromFile("priv.txt");
      if (privateKeys.length === 0) {
        log("No private keys found in priv.txt file.", "error");
        updateStatus("Missing private keys in priv.txt file", "error");
      } else {
        log(`Found ${privateKeys.length} private keys. Authenticating...`, "info");
        await authenticateAllWallets(privateKeys);
        const tokens = auth.readAllSessionTokensFromFile();
        if (tokens.length === 0) {
          log("Authentication failed. No valid tokens received.", "error");
          updateStatus("Authentication failed", "error");
        } else {
          log(`Authentication successful! ${tokens.length} accounts ready.`, "success");
          updateStatus(`${tokens.length} accounts ready. Press S to start`, "success");
        }
      }
    } else if (validTokenCount === 1) {
      log("One valid session token found! Ready for login.", "success");
      updateStatus("Session token ready. Press S to start", "success");
    } else {
      log(`${validTokenCount} valid session tokens found! Ready for login.`, "success");
      updateStatus(`${validTokenCount} accounts ready. Press S to start`, "success");
    }

    render();

    await initAutomation();

    registerKeyHandler("s", async () => {
      if (!getRunningState()) {
        const tokens = auth.readAllSessionTokensFromFile();
        if (tokens.length === 0) {
          log("No session tokens found. Please add session-token.key file.", "error");
          updateStatus("Missing session-token.key", "error");
          render();
          return;
        }
  
        log("Starting automation...", "info");
        logToFile("Starting automation (user initiated)");
        startAutomation();
      } else {
        log("Automation already running", "warning");
        logToFile("Start request ignored - automation already running");
      }
    });

    registerKeyHandler("p", () => {
      if (getRunningState()) {
        log("Pausing automation...", "info");
        logToFile("Pausing automation (user initiated)");
        pauseAutomation();
      } else {
        log("Automation not running", "warning");
        logToFile("Pause request ignored - automation not running");
      }
    });

    registerKeyHandler("r", () => {
      if (!getRunningState()) {
        log("Resuming automation...", "info");
        logToFile("Resuming automation (user initiated)");
        resumeAutomation();
      } else {
        log("Automation already running", "warning");
        logToFile("Resume request ignored - automation already running");
      }
    });

    registerKeyHandler("a", async () => {
      const success = await manualSwitchAccount();
      if (success) {
        log("Account switched successfully", "success");
      } else {
        log("Manual switch is disabled in concurrency mode", "warning");
      }
    });

    registerKeyHandler("l", () => {
      const backupPath = backupLogFile();
      clearLogFile();
      if (backupPath) {
        log(`Log file cleared and backed up to ${backupPath}`, "success");
        logToFile("Log file cleared and backed up (user initiated)");
      } else {
        log("Log file cleared", "success");
        logToFile("Log file cleared (user initiated)");
      }
      render();
    });

    registerKeyHandler("i", () => {
      const fs = require("fs");
      const path = require("path");

      try {
        const logPath = path.join(process.cwd(), "info.log");
        if (fs.existsSync(logPath)) {
          const stats = fs.statSync(logPath);
          const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          const lastModified = new Date(stats.mtime).toLocaleString();
          log(`Log file: Size=${fileSizeMB}MB, Last Modified: ${lastModified}`, "info");
        } else {
          log("Log file does not exist yet", "info");
        }
      } catch (error) {
        log(`Error reading log info: ${error.message}`, "error");
      }

      try {
        const tokens = auth.readAllSessionTokensFromFile();
        const tokenInfo = auth.getTokenInfo();
        if (tokens.length === 0) {
          log("No accounts found", "warning");
        } else if (tokens.length === 1) {
          log("1 account configured", "info");
        } else {
          log(`${tokens.length} accounts configured.`, "info");
        }
      } catch (error) {
        log(`Error checking accounts: ${error.message}`, "error");
      }

      updateStatus("Info displayed", "info");
      setTimeout(() => {
        updateStatus(getRunningState() ? "Running" : "Ready", getRunningState() ? "success" : "info");
        render();
      }, 5000);
      render();
    });

    registerKeyHandler("h", () => {
      log("Controls:", "info");
      log("S - Start automation (requires at least one session token)", "info");
      log("P - Pause automation", "info");
      log("R - Resume automation", "info");
      log("A - Switch account (disabled in concurrency mode)", "info");
      log("L - Clear log file and make backup", "info");
      log("I - Show file and account information", "info");
      log("H - Show this help", "info");
      log("Q or Esc - Quit application", "info");

      updateStatus("Help - press any key to continue", "info");
      render();

      setTimeout(() => {
        updateStatus(getRunningState() ? "Running" : "Ready", getRunningState() ? "success" : "info");
        render();
      }, 8000);
    });
  } catch (error) {
    log(`Application error: ${error.message}`, "error");
    logToFile("Application error", { error: error.message, stack: error.stack });
    updateStatus("Error", "error");
    render();
  }
}

main();
