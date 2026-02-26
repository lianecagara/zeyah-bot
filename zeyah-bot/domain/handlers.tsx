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

import {
  findCommand,
  getAnyCommands,
  getCallableCommands,
  getConfig,
  getRoleName,
  getStaticRole,
  Plugins,
  SemanticVersion,
} from "@zeyah-bot/registry";
import {
  PluginContract,
  ZeyahBaseCTX,
  ZeyahCMD,
  ZeyahCMDCTX,
  ZeyahEventCTX,
  ZeyahInferredEvent,
  ZeyahMessageCTX,
  ZeyahMessageOrReply,
  ZeyahPluginCMDMutateFunc,
  ZeyahPluginDefineFunc,
} from "@zeyah-bot/types";
import { parseArgsOld, parseArgTokens } from "@zeyah-bot/domain/utils";
import { ZeyahIO } from "@zeyah-bot/domain/io";
import { ZeyahAdapter } from "@zeyah-bot/adapters/base";
const config = getConfig();
import { logger } from "@zeyah-utils/logger";
import { inspect } from "node:util";
import { Bold, Italic, List, ListItem } from "@kayelaa/zeyah";
import { UNIRedux } from "@nea-liane/styler";
import { Choice, Random, Shuffle } from "@zeyah-bot/components";
import { usersDB } from "@zeyah-bot/database";

async function triggerPlugins(ctxMutable: ZeyahEventCTX | ZeyahCMDCTX) {
  let usedKeys = new Set<string>();
  const existingProps = Object.keys(ctxMutable);
  const definer: ZeyahPluginDefineFunc<PluginContract["ctx"]> = (
    key,
    value,
  ) => {
    if (usedKeys.has(key) || existingProps.includes(key)) {
      return false;
    }
    usedKeys.add(key);
    Reflect.set(ctxMutable, key, value);
    return true;
  };
  for (const plugin of Plugins) {
    try {
      await plugin.onBeforeHandlers?.(definer, { ...ctxMutable });
    } catch (error) {
      logger.error(error, "Trplugins");
    }
  }
}

async function triggerOnCommandMutatePlugins(ctxMutable: ZeyahCMDCTX) {
  let usedKeys = new Set<string>();
  const getCommand = () => ctxMutable.currentCommand;
  const existingProps = Object.keys(ctxMutable);
  const definer: ZeyahPluginDefineFunc<PluginContract["ctx"]> = (
    key,
    value,
  ) => {
    if (usedKeys.has(key) || existingProps.includes(key)) {
      return false;
    }
    usedKeys.add(key);
    Reflect.set(ctxMutable, key, value);
    return true;
  };
  const mutateCommand: ZeyahPluginCMDMutateFunc = (cmd) => {
    ctxMutable.currentCommand = cmd;
    return true;
  };
  for (const plugin of Plugins) {
    try {
      if (!getCommand().pluginNames.includes(plugin.pluginName)) continue;
      const commandConfig = getCommand().pluginConfig ?? {};

      await plugin.onMutateCurrentCommand?.(
        Reflect.get(commandConfig, plugin.pluginName) ?? {},
        definer,
        mutateCommand,
        { ...ctxMutable },
      );
    } catch (error) {
      logger.error(error, "oncommandplugin");
    }
  }
}

export async function handleCommand(
  event: ZeyahMessageOrReply,
  adapter: ZeyahAdapter,
) {
  event.body ??= "";
  const message = `${event.body}`;
  let [commandName] = message.split(/\s+/);
  let [, ...argTokens] = parseArgTokens(message);
  commandName ??= "";
  let prefixes = config.prefixes ?? [];
  let currentPrefix: string | null = config.prefixes[0];

  let hasPrefix = false;
  for (const p of prefixes) {
    if (message.startsWith(p)) {
      currentPrefix = p;
      hasPrefix = true;
      commandName = commandName.slice(p.length);
      break;
    }
  }
  const others = {};
  const [commandBase = "", commandProp = ""] = commandName
    .split("-")
    .map((i) => i.trim());
  const ctxCmd: ZeyahCMDCTX = {
    ctx: null,
    args: argTokens,
    usersDB,
    commandProp,
    commandName,
    commandBase,
    currentCommand: null,
    event,
    message,
    zeyahIO: new ZeyahIO(event, adapter),
    currentPrefix,
    hasPrefix,
    platform: adapter.platformType,
    role: getStaticRole(event.senderID),
    messageWords: message.split(" ").filter(Boolean),
    async runContextual(contextual) {
      if (!contextual || !("runInContext" in contextual)) {
        throw new Error("Invalid Contextual");
      }
      await contextual.runInContext(ctxCmd);
    },
    ...others,
    userDB: usersDB.getUser(event.senderID),
  };
  ctxCmd.ctx = ctxCmd;
  await triggerPlugins(ctxCmd);
  const { zeyahIO } = ctxCmd;

  let command = findCommand(commandName);
  if (command) {
    ctxCmd.currentCommand = command;
    await triggerOnCommandMutatePlugins(ctxCmd);
  }

  // !!! required if currentCommand changes.
  command = ctxCmd.currentCommand;

  zeyahIO.WrapperFC = command?.WrapperFC;

  if (command) {
    command.prefixMode ??= "required";
    if (!hasPrefix && command.prefixMode === "required") return;

    if (command.platform && command.platform !== adapter.platformType) {
      const platform = command.platform;
      zeyahIO.reply(
        <>
          <Random>
            <Choice>
              <Bold>🔒 Restricted Access!</Bold>
              <br />
              This only works on platform named "{platform}".
            </Choice>

            <Choice>
              <Bold>⚠️ Hold up!</Bold>
              <br />
              Feature available exclusively on "{platform}" platform.
            </Choice>

            <Choice>
              <Bold>🚫 Not Supported!</Bold>
              <br />
              This command is designed only for "{platform}".
            </Choice>

            <Choice>
              <Bold>❗ Platform Locked</Bold>
              <br />
              Sorry, this action is allowed only in "{platform}".
            </Choice>

            <Choice>
              <Bold>🌐 Platform Restriction</Bold>
              <br />
              This functionality operates solely on "{platform}".
            </Choice>
          </Random>
        </>,
      );
      return;
    }

    if (!isRoleSupported(command, ctxCmd)) {
      zeyahIO.reply(
        <>
          <Random>
            <Choice>
              <Bold>👑 No Permission!</Bold>
            </Choice>
            <Choice>
              <Bold>❌ Access denied!</Bold>
            </Choice>
            <Choice>
              <Bold>🚫 You shall not pass!</Bold>
            </Choice>
            <Choice>
              <Bold>⚠️ Permission missing!</Bold>
            </Choice>
            <Choice>
              <Bold>🙅‍♂️ You can't do that!</Bold>
            </Choice>
            <Choice>
              <Bold>😬 Sorry, not allowed!</Bold>
            </Choice>
          </Random>

          <br />
          <br />

          <List ordered={false} prefix={UNIRedux.disc} indent={0}>
            <ListItem>
              <Italic>Your role:</Italic> {ctxCmd.role ?? 0} (
              {getRoleName(ctxCmd.role)})
            </ListItem>
            <ListItem>
              <Italic>Required role:</Italic> {command.role ?? 0} (
              {getRoleName(command.role)})
            </ListItem>
          </List>
        </>,
      );
      return;
    }
    try {
      await command.onCommand?.(ctxCmd);
    } catch (error) {
      logger.error(error, "Handle Command");
    }
  } else if (hasPrefix) {
    zeyahIO.reply(
      <>
        <Random>
          <Choice>
            <Bold>⁉️ Command not found.</Bold>
          </Choice>
          <Choice>
            <Bold>❓ I don't know.</Bold>
          </Choice>
          <Choice>
            <Bold>❌ Unidentifiable Input</Bold>
          </Choice>
          <Choice>
            <Bold>🛑 Hmm… can't process that.</Bold>
          </Choice>
          <Choice>
            <Bold>🤷‍♂️ No clue.</Bold>
          </Choice>
          <Choice>
            <Bold>Beats me.</Bold>
          </Choice>
          <Choice>
            <Bold>¯\_(ツ)_/¯</Bold>
          </Choice>
          <Choice>
            <Bold>Maybe try something else?</Bold>
          </Choice>
        </Random>

        <br />
        <br />

        <Random>
          <Choice>
            <List ordered={false} prefix={UNIRedux.disc} indent={0}>
              <ListItem>Check the spelling of the command.</ListItem>
              <ListItem>Check the help list.</ListItem>
              <ListItem>Ask for guidance from the admin.</ListItem>
            </List>
          </Choice>
          <Choice>
            <List ordered={false} prefix={UNIRedux.disc} indent={0}>
              <ListItem>Maybe try another command.</ListItem>
              <ListItem>Check the documentation.</ListItem>
              <ListItem>Reach out to support.</ListItem>
            </List>
          </Choice>
          <Choice>
            <List ordered={false} prefix={UNIRedux.disc} indent={0}>
              <ListItem>Double-check your input.</ListItem>
              <ListItem>Look at the help list.</ListItem>
              <ListItem>Contact the admin if stuck.</ListItem>
            </List>
          </Choice>
        </Random>
      </>,
    );
  }
}

export function findCommandOLD(commands: ZeyahCMD<any>[], commandName: string) {
  const normalized = commandName.toLowerCase().trim();

  let command = commands.find((i) =>
    [i.name, ...(i.aliases ?? [])]
      .map((x) => x.toLowerCase().trim())
      .includes(normalized),
  );

  if (!command && normalized.includes("-")) {
    const base = normalized.split("-")[0];

    command = commands.find((i) =>
      [i.name, ...(i.aliases ?? [])]
        .map((x) => x.toLowerCase().trim())
        .includes(base),
    );
  }

  return command;
}
export async function handleEvent(
  event: ZeyahInferredEvent,
  adapter: ZeyahAdapter,
) {
  const others = {};
  const ctx: ZeyahEventCTX = {
    zeyahIO: new ZeyahIO(event, adapter),
    event,
    role:
      event.type === "message" || event.type === "message_reply"
        ? getStaticRole(event.senderID)
        : 0,
    ...others,
    usersDB,
    ctx: null,
    platform: adapter.platformType,
  };
  ctx.ctx = ctx;
  await triggerPlugins(ctx);

  const commands = getAnyCommands();
  for (const cmd of commands) {
    try {
      if (cmd.platform && cmd.platform !== adapter.platformType) continue;
      if (!isRoleSupported(cmd, ctx)) continue;
      await cmd.onEvent?.(ctx);
    } catch (error) {
      logger.error(error, "Handle Event");
    }
  }

  if (event.type === "message" || event.type === "message_reply") {
    const message = event.body ?? "";
    const messageCTX: ZeyahMessageCTX = {
      ...ctx,
      message,
      messageWords: message.split(" ").filter(Boolean),
      event,
      zeyahIO: new ZeyahIO(event, adapter),
      usersDB,
      userDB: usersDB.getUser(event.senderID),
      ctx: null,
    };
    messageCTX.ctx = messageCTX;
    for (const cmd of commands) {
      try {
        if (cmd.platform && cmd.platform !== adapter.platformType) continue;
        if (!isRoleSupported(cmd, messageCTX)) continue;
        await cmd.onMessage?.(messageCTX);
      } catch (error) {
        logger.error(error, "Handle Message");
      }
    }
  }
}

export const isRoleSupported = (cmd: ZeyahCMD<any>, ctx: ZeyahEventCTX) => {
  const role = cmd.role ?? 0;
  if (role <= 0) return true;
  return ctx.role >= role;
};
