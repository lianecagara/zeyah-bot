/** @jsxImportSource react */
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

import "@zeyah-bot/legacy/module";
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

import React from "react";
import { Text, render, Box } from "ink";

const App = express();

App.get("/", (req, res) => {
  res.send("Yeah buddy we have no landing page right now.");
});

type SetStats = React.Dispatch<React.SetStateAction<UpdateStatus>>;

interface DashboardProps {
  statusNotifier(s: SetStats): void;
}

interface UpdateStatus {
  plugins: string;
  commands: string;
  setup: string;
  adapters: string;
  database: string;
  server: string;
}

const BotDashboard: React.FC<DashboardProps> = ({ statusNotifier }) => {
  const [status, setStatus] = React.useState<UpdateStatus>({
    plugins: "🔄 Loading...",
    commands: "🔄 Loading...",
    setup: "🔄 Pending...",
    adapters: "🔄 Pending...",
    database: "🔄 Pending...",
    server: "🔄 Pending...",
  });

  React.useEffect(() => {
    statusNotifier(setStatus);
  }, [statusNotifier]);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="cyan"
      padding={1}
      width={50}
    >
      <Box justifyContent="center" marginBottom={1}>
        <Text bold color="magenta">
          🔮 ZEYAH BOT RUNTIME 🔮
        </Text>
      </Box>

      <Box flexDirection="column">
        <Box justifyContent="space-between">
          <Text>Plugins:</Text>
          <Text>{status.plugins}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text>Commands:</Text>
          <Text>{status.commands}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text>Adapter Setup:</Text>
          <Text>{status.setup}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text>Adapters Load:</Text>
          <Text>{status.adapters}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text>Database:</Text>
          <Text>{status.database}</Text>
        </Box>
        <Box justifyContent="space-between" marginTop={1}>
          <Text bold color="yellow">
            Express Server:
          </Text>
          <Text>{status.server}</Text>
        </Box>
      </Box>
    </Box>
  );
};

async function main() {
  let updateStatus: SetStats = () => {};
  const statusNotifier = (updater: SetStats) => {
    updateStatus = updater;
  };
  const INK = render(<BotDashboard statusNotifier={statusNotifier} />);
  await loadAllPlugins();
  updateStatus((prev) => ({ ...prev, plugins: "✅ Loaded" }));
  await loadAllCommands();
  updateStatus((prev) => ({ ...prev, commands: "✅ Loaded" }));
  preloadCommandsVersion(getAnyCommands());
  await globalUtils.delay(100);

  try {
    await setup();
    updateStatus((prev) => ({ ...prev, setup: "✅ Loaded" }));
  } catch (error) {
    // logger.error(error, "Setup");
    updateStatus((prev) => ({ ...prev, setup: `❌ ${error}` }));
  }
  await loadAllAdapters();
  updateStatus((prev) => ({ ...prev, adapters: "✅ Loaded" }));
  try {
    await connect();
    updateStatus((prev) => ({ ...prev, database: "✅ Loaded" }));
  } catch (error) {
    // logger.error(error, "dbconnect");
    updateStatus((prev) => ({ ...prev, database: `❌ ${error}` }));
  }
  const promiseListen = Promise.withResolvers<void>();
  App.listen(8000, () => {
    // logger.log("Server listening to 8000.");
    updateStatus((prev) => ({ ...prev, server: `✅ 8000` }));
    promiseListen.resolve();
  });
  await promiseListen.promise;

  await INK.waitUntilRenderFlush();
  INK.unmount();
  showFinalBanner();
  // console.log({ module, hub: module.hub, meta: module.meta });
}

main();

process.on("uncaughtException", console.error.bind(console));
process.on("unhandledRejection", console.error.bind(console));

import express from "express";
