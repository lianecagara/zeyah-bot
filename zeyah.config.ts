import { defineConfig } from "@zeyah-bot/registry";
import "dotenv/config";
import { sixSevenPlugin } from "./checked/sixSeven-plugin";
import { menuHandlePlugin } from "./checked/menu-handle";

export default defineConfig({
  DESIGN: {
    Title: "Zeyah",
    Admin: "YOUR_NAME",
    Theme: "retro",
  },
  adminBot: ["1234346521881739307"],
  moderatorBot: [],
  prefixes: [process.env.PREFIX ?? "+"],
  useDiscord: true,
  useFacebook: true,
  discordToken: process.env.DISCORD_TOKEN ?? "",
  plugins: [sixSevenPlugin, menuHandlePlugin],
  pluginConfig: {
    "menu-handle": {},
    "six-seven": {
      enabled: true,
    },
  },
  lang: "en",
});
