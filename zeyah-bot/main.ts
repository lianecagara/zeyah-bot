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

import "@zeyah-bot/domain/module";
import "dotenv/config";
import { setup } from "@zeyah-bot/adapterSetup";
import {
  getAnyCommands,
  loadAllAdapters,
  loadAllCommands,
  loadAllPlugins,
  preloadCommandsVersion,
} from "@zeyah-bot/registry";
import { logger, showFinalBanner } from "@zeyah-utils/logger";
import { inspect } from "node:util";
import { connect } from "@zeyah-bot/database";
// import "@zeyah-bot/test";
import * as globalUtils from "@zeyah-utils";
import * as globalComponents from "@zeyah-bot/components";

declare global {
  export import utils = globalUtils;
  export import Components = globalComponents;
  export import Comps = globalComponents;
}
globalThis.utils = globalUtils;
globalThis.Components = globalComponents;
globalThis.Comps = globalComponents;
async function main() {
  await loadAllPlugins();
  await loadAllCommands();
  preloadCommandsVersion(getAnyCommands());
  await globalUtils.delay(100);
  showFinalBanner();
  try {
    await setup();
  } catch (error) {
    logger.error(error, "Setup");
  }
  await loadAllAdapters();
  try {
    await connect();
  } catch (error) {
    logger.error(error, "dbconnect");
  }
  App.listen(8000, () => {
    logger.log("Server listening to 8000.");
  });
}

main();

process.on("uncaughtException", console.error.bind(console));
process.on("unhandledRejection", console.error.bind(console));

import express from "express";

const App = express();

App.get("/", (req, res) => {
  res.send("Yeah buddy we have no landing page right now.");
});
