<h1 align="center">Zeyah Bot System</h1>

<p align="center">
  <img alt="Node.js Support" src="https://img.shields.io/badge/Node.js-20.x-brightgreen.svg?style=flat-square">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-green?style=flat-square">
  <img alt="Version" src="https://img.shields.io/badge/version-0.8.1-blue?style=flat-square">
</p>

**Zeyah Bot** is a powerful, multi-platform bot system designed for flexibility, precision, and a modern developer experience. It provides a unified framework to build bots for both **Facebook (via ws3-fca)** and **Discord (via discord.js)** using TypeScript and JSX.

- [🚧 Setup](#-setup)
- [💡 Why Zeyah Bot?](#-why-zeyah-bot)
- [🛠️ Creating Commands](#️-creating-commands)
- [📚 API Documentation](#-api-documentation)
- [✨ Credits](#-credits)
- [📜 License](#-license)

<hr>

## 🚧 Setup

### 1. Requirements
- **Node.js 20.x** or higher.
- Knowledge of **TypeScript** and **JSX**.
- A Facebook account (for FB bot) or a Discord Bot Token (for Discord bot).

### 2. Installation
```bash
git clone <your-repo-url>
cd zeyah-bot-system
npm install
```

### 3. Discord Configuration
1. Create a bot on the [Discord Developer Portal](https://discord.com/developers/applications).
2. Create a `.env` file in the root directory and add:
   ```env
   DISCORD_TOKEN=your_discord_bot_token
   PREFIX=+
   ```

### 4. Facebook Configuration
1. Obtain your `appState` (Facebook login cookies) using a browser extension like "c3c-fbstate".
2. Save the content as `fbstate.json` in the project root.

### 5. Customization
Modify `zeyah.config.ts` to set your bot's design and features:
```ts
export default defineConfig({
  DESIGN: {
    Title: "Zeyah",
    Admin: "Your Name",
    Theme: "retro",
  },
  useDiscord: true,
  useFacebook: true,
  // ...
});
```

### 6. Starting the Bot
```bash
npm start
```

<hr>

## 💡 Why Zeyah Bot?

Zeyah Bot is built to be superior to traditional bot frameworks by focusing on developer ergonomics and cross-platform consistency:

- **🚀 Smart Import Aliases**: Stop using messy relative paths like `../../utils`. Use `@zeyah-bot/*` and `@zeyah-utils` for clean, predictable imports.
- **🎨 JSX Rendering Engine**: write your UI once using JSX. Zeyah automatically renders it as **Rich Embeds/Markdown** for Discord and **Unicode-styled text** for Facebook.
- **📁 Multi-Command Files**: Don't limit yourself to one command per file. Zeyah allows you to register and export multiple commands from a single `.tsx` file.
- **🔢 Infinite Precision with Decimal.js**: Most bots fail with large numbers. Zeyah uses `Decimal.js` for all currency, points, and gambling logic, allowing for infinite possible values and perfect mathematical precision.
- **⚡ ZeyahIO Facade**: A powerful abstraction layer. Whether you're on Discord or FB, `zeyahIO` provides a consistent API for sending messages, replies, and handling errors with minimal code.
- **👂 Inline Listeners**: Say goodbye to global `onReply` hooks. Zeyah allows you to listen to replies or reactions **inline** within your command handler using an event-driven approach.

<hr>

## 🛠️ Creating Commands

Commands are registered using a structured interface that ensures type safety and consistency.

```tsx
import { Bold, Italic } from "@kayelaa/zeyah";

export const Greet = module.register({
  name: "greet",
  emoji: "👋",
  description: "Greets the user and waits for a response",
  async onCommand({ zeyahIO }) {
    // Send a message and get a handle for listeners
    const sent = await zeyahIO.reply(
      <>
        Hello! How are you <Bold>today</Bold>?
      </>
    );

    // Inline reply listener
    sent.listenReplies({ timeout: 30000 }); // Listen for 30 seconds
    sent.on("reply", async (replyIO, event) => {
      await replyIO.reply(<>I'm glad you are {event.body}!</>);
    });
  }
});
```

<hr>

## 📚 API Documentation

### **ZeyahIO**
The core interaction class for all commands.

- **`reply(body)`**: Sends a reply to the message that triggered the command.
- **`send(body)`**: Sends a message to the current thread without a direct reply link.
- **`unsend(dispatched)`**: Removes a message previously sent by the bot.
- **`error(err)`**: Formats and sends an error message to the user.
- **`assertDangerousAPI(adapterClass)`**: Access the underlying platform API (e.g., `discord.js` Client) when platform-specific logic is needed.

### **Utility Functions**
Zeyah comes with a suite of built-in utilities:
- **`randomInt(min, max)`**: Cryptographically secure random integers.
- **`parseBetDecimal(arg, balance)`**: Parses complex bet strings like "50%", "allin", or "1.5k".
- **`abbreviateNumberDecimal(value)`**: Formats huge numbers into readable strings (e.g., `1.5Qa`).
- **`parallel(...tasks)`**: Simplified concurrent execution of async tasks.

### **Built-in Components**
Enhance your bot's output with cross-platform components:
- **`<Embed>`**: Renders as a Rich Embed on Discord and a formatted text block on Facebook.
- **`<Random>`**: Wraps `<Choice>` components to randomly output one of its children.
- **`<Points n={value} />`**: Specialized component for displaying currency with icons and abbreviations.
- **`<Lang.Group>`**: Handles localization by rendering content based on the bot's configured language.

<hr>

## ✨ Credits
*(Jsdoc fully written by jules with help of lianecagara)*

- **Author**: Kayelaa Cagara (@lianecagara)
- **Framework**: @kayelaa/zeyah
- **Utilities**: BotPack, Goat-Bot-V2

<hr>

## 📜 License
This project is licensed under the **MIT License**.
