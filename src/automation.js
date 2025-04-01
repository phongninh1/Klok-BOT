const pLimit = require("p-limit");
const { auth, chat, models, points, rateLimit } = require("./api");
const RateLimiter = require("./api/rate-limit");
const { groq } = require("./services");
const { log, logToFile, checkLogSize } = require("./utils");
const config = require("../config");

const THREADS = config.THREADS || 10;

let isRunning = false;

async function initAutomation() {
  try {
    log("Initializing services...", "info");
    logToFile("Initializing automation services");

    await groq.initGroqClient();

    log("Ready to start automation", "success");
    return true;
  } catch (error) {
    log(`Initialization error: ${error.message}`, "error");
    logToFile("Initialization error", { error: error.message, stack: error.stack });
    return false;
  }
}

async function runSingleAutomation(token, idx) {
  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 3;

  function localLog(message, level = "info") {
    log(`[${token.slice(0,8)}] [${idx}] ${message}`, level);
  }
  function localLogToFile(message, data = null, verbose = true) {
    logToFile(`[${token.slice(0,8)}] [${idx}] ${message}`, data, verbose);
  }

  try {
    auth.setCurrentToken(token);

    await auth.login(false);

    const limiter = new RateLimiter(token);

    const pts = await points.getUserPoints();
    localLog(`Token ${token.slice(0, 8)} => points: ${pts.total_points}`, "info");

    const modelList = await models.getModels();
    localLog(`Token ${token.slice(0, 8)} => model count: ${modelList.length}`, "info");
    await models.selectDefaultModel();

    chat.createThread();

    localLog(`Automation started for token: ${token.slice(0, 8)}`, "info");
    logToFile("Automation started for token", { tokenPreview: token.slice(0, 8) });

    while (isRunning) {
      checkLogSize();

      // const available = await rateLimit.checkRateLimitAvailability();
      // if (!available) {
      //   const info = await rateLimit.getRateLimit();
      //   if (info.remaining === 0) {
      //     log(`Token ${token.slice(0,8)} => exhausted daily limit => finishing`, "warning");
      //   } else {
      //     log(`Token ${token.slice(0,8)} => partial cooldown => finishing anyway`, "warning");
      //   }
      //   break;
      // } else {
      //   const info = await rateLimit.getRateLimit();
      //   if (info.remaining === 0) {
      //     log(`Token ${token.slice(0,8)} => remain=0 => finishing`, "warning");
      //     break;
      //   }
      // }

      try {
        const newRL = await limiter.getRateLimit();
        if (newRL.remaining === 0) {
          localLog(`Token ${token.slice(0, 8)} => remain=0 => finished. Switching to next token.`, "warning");
          await auth.switchToNextToken();
          break;
        }
      } catch (rlErr) {
        logToFile(`Rate limit error token ${token.slice(0, 8)}`, { error: rlErr.message }, false);
      }

      const userMessage = await groq.generateUserMessage();

      try {
        await chat.sendChatMessage(userMessage);
        consecutiveErrors = 0;
      } catch (chatError) {
        consecutiveErrors++;
        logToFile(
          `Chat error (consecutive: ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}) for token ${token.slice(0, 8)}`,
          { error: chatError.message },
          false
        );

        if (
          chatError.response &&
          (chatError.response.status === 401 || chatError.response.status === 403)
        ) {
          localLog(`Token ${token.slice(0, 8)} => invalid => stop`, "warning");
          break;
        }

        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          localLog(`Too many errors for token ${token.slice(0, 8)} => pausing 3m`, "error");
          await new Promise((r) => setTimeout(r, 180000));
          consecutiveErrors = 0;
        } else {
          await new Promise((r) => setTimeout(r, 10000));
        }
        continue;
      }

      try {
        const updatedPoints = await points.getUserPoints();
        localLog(`Token ${token.slice(0, 8)} => updated points: ${updatedPoints.total_points}`, "info");
      } catch (ptErr) {
        logToFile(`Points update error for token ${token.slice(0, 8)}`, { error: ptErr.message }, false);
      }

      const delay = Math.floor(Math.random() * 7000) + 3000;
      localLog(`Token ${token.slice(0, 8)} sleeping ${delay / 1000}s...`, "info");
      await new Promise((r) => setTimeout(r, delay));
    }

    localLog(`Automation ended for token ${token.slice(0, 8)}`, "info");
  } catch (error) {
    localLog(`Fatal error for token ${token.slice(0, 8)} => ${error.message}`, "error");
    logToFile("Fatal error for token", { token: token.slice(0, 8), error: error.message }, false);
  }
}

async function startAutomation() {
  if (isRunning) {
    log("Automation already running", "warning");
    return;
  }
  isRunning = true;
  log("Starting multi-token automation with concurrency (no cooldown wait)...", "info");
  logToFile("Starting multi-token automation with concurrency (no cooldown wait)");

  const tokens = auth.readAllSessionTokensFromFile();
  if (!tokens || tokens.length === 0) {
    log("No tokens found. Cannot start automation.", "error");
    isRunning = false;
    return;
  }

  const limit = pLimit(THREADS);
  tokens.forEach((tk, i) => {
    limit(() => runSingleAutomation(tk, i + 1));
  });

  log(`Queued ${tokens.length} tokens with concurrency=${THREADS}`, "info");
}

function pauseAutomation() {
  if (!isRunning) {
    log("Automation not running", "warning");
    return;
  }
  isRunning = false;
  log("Automation paused", "warning");
  logToFile("Automation paused");
}

function resumeAutomation() {
  if (isRunning) {
    log("Automation already running", "warning");
    return;
  }
  log("Resuming automation...", "info");
  logToFile("Resuming automation");
  startAutomation();
}

function getRunningState() {
  return isRunning;
}

async function manualSwitchAccount() {
  log("manualSwitchAccount() is disabled in concurrency mode", "warning");
  return false;
}

module.exports = {
  initAutomation,
  startAutomation,
  pauseAutomation,
  resumeAutomation,
  manualSwitchAccount,
  getRunningState,
};
