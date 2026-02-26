/**
 * @license MIT
 * @author lianecagara
 *
 * WARNING:
 * Modify at your own risk. You may or may not tamper with this file,
 * but we are not responsible for any side effects, runtime failures,
 * logic corruption, or anything that goes wrong after modification.
 *
 * Do not distribute repositories containing modified internal files like this one.
 *
 * Official repository source (if applicable):
 * https://github.com/lianecagara/zeyah-bot
 *
 * If this file is not from the repository above, treat it as potentially unsafe.
 */

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
    let state = fbState;
    if (process.env.FB_STATE) {
      state = JSON.parse(process.env.FB_STATE);
    }
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
