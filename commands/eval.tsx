import { Bold } from "@zeyah-bot/components";
import { evalTsx } from "@zeyah-bot/utils/ts-eval";
import { inspect } from "node:util";
import * as Registry from "@zeyah-bot/registry";
import * as utils from "@zeyah-bot/utils";
import * as Comps from "@zeyah-bot/components";

export const Eval = module.register({
  emoji: "🤣",
  name: "eval",
  role: 2,
  version: "1.0.0",
  author: ["@lianecagara"],
  pluginNames: [],
  description: "Evaluate a Typescript Code.",
  async onCommand({ zeyahIO, messageWords, ctx }) {
    const code = messageWords.slice(1).join(" ");
    if (!code) {
      return zeyahIO.reply(
        <>
          Enter any <Bold>Javascript/Typescript</Bold> code to evaluate safely.
        </>,
      );
    }
    try {
      await evalTsx(code, {
        ...ctx,
        inspect,
        Registry,
        utils,
        Comps,
      });
    } catch (error) {
      zeyahIO.error(error);
    }
  },
});
