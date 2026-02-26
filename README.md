<h1 align="center">Zeyah Bot System</h1>

<p align="center">
  <img alt="Node.js Support" src="https://img.shields.io/badge/Node.js-20.x-brightgreen.svg?style=flat-square">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-green?style=flat-square">
  <img alt="Version" src="https://img.shields.io/badge/version-0.8.1-blue?style=flat-square">
</p>

**Zeyah Bot** is a next-generation, multi-platform bot framework built for TypeScript enthusiasts who demand precision, flexibility, and a superior developer experience. It allows you to build powerful bots for both **Facebook (via ws3-fca)** and **Discord (via discord.js)** using a single, unified codebase powered by **JSX**.

- [🚀 Why Migrate to Zeyah?](#-why-migrate-to-zeyah)
- [🚧 Setup & Configuration](#-setup--configuration)
- [📁 Command System](#-command-system)
- [🛠️ Detailed API Documentation](#️-detailed-api-documentation)
- [✨ Credits](#-credits)
- [📜 License](#-license)

<hr>

## 🚀 Why Migrate to Zeyah?

Most bot frameworks are stuck in the past. Zeyah Bot brings modern web development patterns to the chat bot world.

### 1. Unified JSX Rendering (The Unicode Killer)
Stop hardcoding messy Unicode characters or Discord-specific Markdown. Zeyah uses a custom **JSX Rendering Engine**.
- **On Discord**: Renders as Rich Embeds and standard Markdown.
- **On Facebook**: Automatically converts your JSX elements into Unicode-styled text (Bold, Italic, etc.) and CasS formatting.
- **Example**: `<Bold>Hello</Bold>` becomes **Hello** on Discord and `𝐇𝐞𝐥𝐥𝐨` on Facebook automatically.

### 2. Infinite Precision with Decimal.js
Standard JavaScript numbers fail when dealing with huge currency values or complex gambling math. Zeyah integrates `Decimal.js` at its core.
- No more rounding errors.
- Support for values up to $10^{308}$ and beyond.
- Perfect for high-stakes gambling bots and complex economy systems.

### 3. Inline Event Listeners (No more global mess)
Tired of handling replies in a separate `onReply` method and losing context? Zeyah lets you listen to responses **directly inside your command logic**.
- Chain interactions easily.
- Keep state local to the command execution.
- Auto-timeout management.

### 4. Developer Ergonomics
- **Smart Path Aliases**: Use `@zeyah-bot/*` and `@zeyah-utils` to avoid the `../../../../` nightmare.
- **Multi-Command Files**: Register 1, 5, or 10 commands in a single `.tsx` file. Logical grouping has never been easier.
- **ZeyahIO Facade**: A clean, high-level API that works identically across all platforms. `zeyahIO.reply()` is all you need.

> [!TIP]
> **Developer Experience:** We have invested heavily in JSDoc. Using an IDE like **VS Code** or platforms like **Replit** will give you full autocomplete, type checking, and instant documentation on hover.

<hr>

## 🚧 Setup & Configuration

### 1. Requirements
- **Node.js 20.x** or higher.
- Knowledge of **TypeScript** and **JSX** (recommended).
- A Facebook account or Discord Bot Token.

### 2. Installation
### 🚧 Recommended Workflow

#### 1. Clone the repository

```bash
git clone https://github.com/lianecagara/zeyah-bot
cd zeyah-bot
````

If you want the project as a **fresh independent project** (no upstream tracking), remove git history:

```bash
rm -rf .git
```

This is useful if you are building your own project based on zeyah-bot.

---

#### 2. Install dependencies

```bash
npm install
```

---

#### 3. Important — Run updater after clone

Run the updater once so your local copy is synchronized with upstream changes:

```bash
npm run update
```

👉 This is highly recommended to avoid missing framework fixes or patches.

---

#### 4. Create your own repository (optional)

If you want to turn this into a new project repository:

```bash
git init
git add .
git commit -m "Initial Zeyah Bot setup"
```

Then push to your repository:

```bash
git remote add origin <your-repo-url>
git branch -M master
git push -u origin master
```

---

#### ⚠️ Notes

* Keep the updater script available for future framework updates.
* Avoid modifying core framework files unless you understand merge behavior.
* Pull upstream updates before performing major customization.

### 3. Platform Setup
- **Discord**: Add `DISCORD_TOKEN` to your `.env` file.
- **Facebook**: Export your `appState` (cookies) using an extension and save it as `fbstate.json` in the root directory.

### 4. Configuration
Modify `zeyah.config.ts` to enable platforms and set themes:
```ts
export default defineConfig({
  useDiscord: true,
  useFacebook: true,
  DESIGN: {
    Title: "MyZeyah",
    Admin: "AuthorName",
    Theme: "retro", // Choose from blue, fiery, aqua, hacker, etc.
  },
  // ...
});
```

<hr>

## 📁 Command System

All commands live in the `commands/` directory. Zeyah supports several file extensions:
- `.tsx` (Recommended for full JSX and Type support)
- `.ts`, `.js`, `.jsx`

### Command Properties Reference

| Property | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `name` | `string` | Yes | The unique identifier for the command. |
| `emoji` | `string` | Yes | Icon used in help menus. |
| `version` | `SemVer` | Yes | Semantic version (e.g., `1.0.0`). |
| `author` | `string \| string[]` | Yes | GitHub username(s) starting with `@`. |
| `onCommand` | `Function` | No* | Handle command execution. |
| `aliases` | `string[]` | No | Alternative triggers. |
| `role` | `CMDRole` | No | Permission level (Everyone, Moderator, Admin). |
| `description` | `string` | No | Help text. |
| `argGuide` | `string[]` | No | Argument format guide (e.g., `["<name>", "[age]"]`). |
| `prefixMode` | `"required" \| "optional"`| No | Defaults to `"required"`. |
| `platform` | `PlatformType` | No | Restrict command to a specific platform. |

*\*A command must have at least one handler: `onCommand`, `onEvent`, or `onMessage`.*

### Example: High-Performance Economy Command
This example demonstrates `Decimal.js` integration and inline listeners.

```tsx
import { Bold } from "@kayelaa/zeyah";
import { Points } from "@zeyah-bot/components";

export const BetCommand = module.register({
  name: "bet",
  emoji: "💰",
  author: "@jules",
  version: "1.0.0",
  description: "Bet your points!",
  async onCommand({ zeyahIO, userDB, args }) {
    const balance = await userDB.getPoints(); // Returns Decimal
    const amount = utils.parseBetDecimal(args[0], balance);

    if (amount.isNaN() ||amount.lte(0) || amount.gt(balance) || amount.gt(1e+6)) {
      return zeyahIO.reply(<>Invalid bet amount!</>);
    }

    const sent = await zeyahIO.reply(
      <>
        You are betting <Points n={amount} />. Are you sure? Reply with{" "}
        <Bold>yes</Bold> to confirm.
      </>,
    );

    // Inline Listener Edge Case: Handling context locally
    sent.listenReplies({ timeout: 15000 });
    sent.on("reply", async (replyIO, event) => {
      const balance = await userDB.getPoints(); // Refresh
      if (event.body.toLowerCase() === "yes") {
        const win = Math.random() > 0.5;
        const newBalance = win ? balance.add(amount) : balance.sub(amount);
        await userDB.setPoints(newBalance);

        await replyIO.reply(
          win ? (
            <>
              🎉 You won! New balance: <Points n={newBalance} />
            </>
          ) : (
            <>💀 You lost everything.</>
          ),
        );
      }
      sent.stopListenReplies();
    });
  },
});
```

### Botpack / Mirai Compatibility
If you are migrating from Botpack or Mirai, Zeyah can load your legacy scripts with a tiny tweak. Replace `module.exports` with `module.mirai`:

```js
// OLD: module.exports.config = { ... }
// NEW:
module.mirai.config = {
  name: "legacy-cmd",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Author",
  description: "Legacy support",
  commandCategory: "utility",
  usages: "",
  cooldowns: 5
};

module.mirai.run = async ({ api, event, args }) => {
  // Your legacy code here
};
```

<hr>

## 🛠️ Detailed API Documentation

### **The ZeyahIO Facade**
The `zeyahIO` object is passed to every command handler and is your primary way to talk back to the user.

- **`reply(body)`**: The safest way to respond. Body can be a string or JSX.
- **`send(body)`**: Send a message to the thread without quoting the user.
- **`unsend(handle)`**: Remove a message.
  ```ts
  const msg = await zeyahIO.send("Wait for it...");
  await utils.delay(2000);
  await zeyahIO.unsend(msg);
  ```
- **`error(err)`**: Standardized error reporting.
- **`assertDangerousAPI(adapterClass)`**: For when you absolutely need platform-specific features (e.g., Discord attachments or Facebook-specific thread tags).

### **Built-in JSX Components**
Zeyah components are designed for cross-platform beauty.

- **`<Embed>`**:
  ```tsx
  zeyahIO.reply(<Embed>
    <EmbedTitle>System Status</EmbedTitle>
    <EmbedDescription>All systems operational.</EmbedDescription>
    <EmbedFooter>Uptime: 99.9%</EmbedFooter>
  </Embed>);
  ```
- **`<Random>` / `<Choice>`**:
  ```tsx
  zeyahIO.reply(<Random>
    <Choice>Hello there!</Choice>
    <Choice>Hi!</Choice>
    <Choice>Greetings, mortal.</Choice>
  </Random>);
  ```
- **`<Lang.Group>`**: Support for `en`, `tl`, `vi`, etc.
- **`<DiscordMention event={event} />`**: Smart mention that resolves correctly on Discord.

<hr>

## ✨ Credits
*(Jsdoc fully written by jules with help of lianecagara)*

- **Core Developer**: [Kayelaa Cagara (@lianecagara)](https://github.com/lianecagara)
- **Framework**: @kayelaa/zeyah
- **Utilities**: Derived from BotPack and Goat-Bot-V2.

<hr>

## 📜 License
Licensed under the **MIT License**. Build something amazing!
