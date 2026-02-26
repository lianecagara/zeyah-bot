import { getConfig, register, registerAdapter } from "@zeyah-bot/registry";
import fbState from "../fbstate.json";
import { Ws3FBAdapter } from "@zeyah-bot/adapters/fbAdapter";
import { LoginOptions } from "ws3-fca";
import { DiscordAdapter } from "@zeyah-bot/adapters/discordAdapter";
import { logger } from "@zeyah-utils/logger";
import { inspect } from "node:util";
const config = getConfig();

const loginOptions: LoginOptions = {
  autoMarkDelivery: false,
  autoMarkRead: false,
  autoReconnect: true,
  forceLogin: true,
  listenEvents: true,
  listenTyping: false,
  online: true,
  selfListen: false,
  updatePresence: false,
};

export async function setup() {
  if (config.useFacebook) {
    const ws3Adapter = await Ws3FBAdapter.fromLogin(
      { appState: fbState },
      loginOptions,
    );
    registerAdapter("Facebook", ws3Adapter);
  }
  const discordToken = config.discordToken ?? "";

  if (discordToken && config.useDiscord) {
    try {
      const discordAdapter = new DiscordAdapter(discordToken);
      registerAdapter("Discord", discordAdapter);
    } catch (error) {
      logger.error(error, "Discord");
    }
  }
}
