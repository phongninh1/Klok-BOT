# KlokAI BOT - AI Powered Automation 🤖

A terminal-based automation tool for KlokApp AI chat with session token authentication and a resilient retry mechanism.

---

## ✨ Features

- **🔑 Session Token Authentication** - Direct login using KlokApp session token
- **📊 Interactive Dashboard** - Beautiful terminal UI with `blessed` and `blessed-contrib`
- **🤖 Automated Prompts** - Generate creative prompts using Groq API
- **⏳ Rate Limit Management** - Automatic cooldown when limits are reached
- **📌 Point Tracking** - Real-time monitoring of inference points
- **🔄 Automatic Retry** - Handles network and server errors
- **📡 Stream Verification** - Ensures successful message delivery
- **🌐 Proxy Support** - Uses user-provided proxy if available, defaults to system IP otherwise
- **📜 Detailed Logging** - Comprehensive monitoring and debugging

---

## 📂 Directory Structure

```
KlokAI-BOT/
├── package.json         # Project dependencies
├── session-token.key    # Session token for login (optional, auto-generated)
├── groq-api.key         # Groq API key
├── proxies.txt          # Proxy configuration (optional)
├── priv.txt             # Private keys for auto-authentication
├── info.log             # Log file for monitoring
├── index.js             # Main entry point
├── config.js            # App configuration
└── src/
    ├── api/             # KlokApp API functions
    ├── ui/              # UI components
    ├── services/        # External services
    └── utils/           # Utilities
```

---

## 🛠️ Installation

### 🔹 Linux/macOS

1. Clone the repository:
   ```sh
   git clone https://github.com/RPC-Hubs/Klok-BOT.git
   cd Klok-BOT
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Configure **Proxy** (optional):
   ```sh
   nano proxies.txt
   ```
   Format:
   ```sh
   http://username:password@ip:port
   ```

4. Add **Groq API Key**:
   ```sh
   nano groq-api.key
   ```

5. (Optional) Add **Private Keys** for Auto-Login:
   ```sh
   nano priv.txt
   ```
   - Each line should contain a private key
   - Used to auto-generate `session-token.key` at startup

6. Run the application:
   ```sh
   npm start
   ```

### 🔹 Windows

1. Open **PowerShell** and run:
   ```powershell
   git clone https://github.com/RPC-Hubs/Klok-BOT.git
   cd Klok-BOT
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Configure **Proxy** (optional):
   - Open `proxies.txt`, add:
     ```
     http://username:password@ip:port
     ```

4. Add **Groq API Key**:
   - Open `groq-api.key` in Notepad and paste your key.

5. (Optional) Add **Private Keys** to `priv.txt`

6. Start the application:
   ```powershell
   npm start
   ```

---

## 🌛 Running the Automation

Start the app:
```sh
npm start
```

### 🎮 Keyboard Controls

- `S` - Start automation
- `P` - Pause automation
- `R` - Resume automation
- `A` - Manually switch account (if enabled)
- `L` - Clear log file
- `I` - Show session & log info
- `H` - Help
- `Q` or `Esc` - Quit

---

## 📜 Logging & Error Handling

- **Automatic Retry** on network/server failures
- **Exponential Backoff** for rate-limiting
- **Authentication Fallback** using private keys
- **Session Token Cleanup** if invalid

---

## ⚙️ Advanced Configuration

Edit `config.js` to control automation behavior:

```js
module.exports = {
  THREADS: 20, // Parallel execution threads
  BASE_URL: "https://api1-pp.klokapp.ai/v1",
  GROQ_API_KEY_PATH: "./groq-api.key",
  GROQ_MODEL: "llama3-8b-8192",
  DEFAULT_HEADERS: {
    "content-type": "application/json",
    Origin: "https://klokapp.ai",
    Referer: "https://klokapp.ai/"
  },
  REFERRAL_CODE: {
    referral_code: "GVJRESB4"
  },
  MIN_CHAT_DELAY: 3000,
  MAX_CHAT_DELAY: 10000,
};
```

### Notes:
- Lower `THREADS` if facing API rate limits or CPU constraints
- Modify `MIN_CHAT_DELAY`/`MAX_CHAT_DELAY` to control chat frequency

---

## 🔑 Session-token.key Auto-Generation

If no `session-token.key` is found at startup:

- The app will attempt to authenticate using `priv.txt`
- On success, it will generate a new `session-token.key` automatically
- The file is reset on every launch to ensure fresh authentication

Ensure `priv.txt` is present with valid private keys to enable this feature.

---

## 🔗 Useful Links 🌍

- [Github Repository](https://github.com/rpchubs)
- [KlokAI](https://klokapp.ai?referral_code=GVJRESB4)
- [Groq Console](https://console.groq.com/login)

---

## 🙋‍♂️ Support & Community

- 💬 [Join RPC Community Chat](https://t.me/chat_RPC_Community)
- 📣 [Follow RPC Hubs Channel](https://t.me/RPC_Hubs)

---

## ❤️ Made with love by the RPC Hubs Team

