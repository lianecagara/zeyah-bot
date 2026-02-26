import zeyahConfig from "@config";
import { Bold, Code, Italic } from "@kayelaa/zeyah";
import { Breaks, Choice, Random } from "@zeyah-bot/components";
import { randomArrayValue } from "@zeyah-utils";

export const PrefixEvent = module.register({
  emoji: "⚙️",
  name: "prefix",
  version: "1.0.0",
  author: "@lianecagara",
  pluginNames: ["menu-handle"],
  description: "Event Handler for 'prefix'",
  async onCommand({ handle, zeyahIO }) {
    if (handle.isApplicable()) {
      return handle.end();
    }
    const list = handle.getListNode();
    zeyahIO.reply(
      <>
        <Bold>Hey!! Options:</Bold>
        <Breaks n={2} />
        {list}
      </>,
    );
  },

  pluginConfig: {
    "menu-handle": {
      on_all({ zeyahIO, currentPrefix }) {
        zeyahIO.reply(
          <>
            💻 <Italic>System Prefix:</Italic> <Code>{currentPrefix}</Code>
            <br />
            🖥️ <Italic>All Prefixes:</Italic>{" "}
            <Code>[ {zeyahConfig.prefixes.join(", ")} ]</Code>
          </>,
        );
      },
      on_main({ zeyahIO, currentPrefix }) {
        zeyahIO.reply(
          <>
            💌 Type <Code>{currentPrefix}help</Code> to view available commands!
          </>,
        );
      },
    },
  },
  async onMessage({ message, zeyahIO }) {
    if (["prefix", "zeyah", "bot"].includes(message)) {
      const prefix = randomArrayValue(zeyahConfig.prefixes);
      zeyahIO.reply(
        <>
          <Bold>
            <Random>
              <Choice>💅 Hello, I'm here!</Choice>
              <Choice>😭 Sup????</Choice>
              <Choice>🙏 Aww, wanna get to know?</Choice>
              <Choice>✌️ Available!!!</Choice>
              <Choice>🫵 I'm here for you!</Choice>
            </Random>
          </Bold>
          <Breaks n={2}></Breaks>
          <Random>
            <Choice>
              💌 Type <Code>{prefix}help</Code> to view available commands!
            </Choice>
            <Choice>
              🥂 My prefix is <Code>[ {prefix} ]</Code>! Thank you.
            </Choice>
            <Choice weight={2}>
              💻 <Italic>System Prefix:</Italic> <Code>{prefix}</Code>
              <br />
              🖥️ <Italic>All Prefixes:</Italic>{" "}
              <Code>[ {zeyahConfig.prefixes.join(", ")} ]</Code>
            </Choice>
          </Random>
        </>,
      );
    }
  },
  async onEvent({ zeyahIO }) {
    if (zeyahIO.eventType("event")) {
      const logEvent = zeyahIO.getLogEvent();
      if (logEvent.isAdminEvent()) {
        if (logEvent.isAdminAdded()) {
        } else if (logEvent.isAdminRemoved()) {
        }
      }
    }
  },
});
