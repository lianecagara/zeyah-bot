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

import pino from "pino";
export * from "@zeyah-utils/botpack-logger";

export const logger_old = pino({
  level: process.env.LOG_LEVEL || "trace",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: false,
      ignore: "pid,hostname,time",
      singleLine: false,
      levelFirst: true,
    },
  },
});

/**
 * **logger** is an instance of **BotpackLogger** used for system-wide logging.
 */
export const logger = BotpackLogger;

import figlet from "figlet";

import pkg from "@package";
import path from "node:path";
import { readFileSync } from "node:fs";
import BotpackLogger from "@zeyah-utils/botpack-logger";
import { getConfig } from "@zeyah-bot/registry";
const config = getConfig();

const fontPath = path.join(process.cwd(), "zeyah-bot", "Pagga.flf");

const font = readFileSync(fontPath, "utf8");
figlet.parseFont("pagga", font);

/**
 * **showFinalBanner()** displays the bot's startup banner in the console.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export function showFinalBanner() {
  const logo = figlet.textSync(config.DESIGN.Title ?? "ZeyahBot", {
    font: "pagga",
    horizontalLayout: "default",
    verticalLayout: "default",
  });

  const name = config.DESIGN.Admin;

  console.log();
  logger.themed(logo);
  logger.themed(`By: @lianecagara`);

  console.log();

  logger.themed(`Admin : ${name}`);
  logger.themed(`Version: ${pkg.version}`);
  logger.themed("Booting up Zeyah-Bot adapters...\n");
}
