// Original: https://github.com/YANDEVA/BotPack
// Converted to Typescript to fix the mess.
import chalk from "chalk";
import { inspect } from "node:util";

import { Theme, ThemeMap } from "@zeyah-utils/logger-themes";
import { getConfig } from "@zeyah-bot/registry";
const con = getConfig();

export namespace BotpackLogger {
  export function getThemeColors(): Theme {
    const theme = con.DESIGN.Theme;
    return ThemeMap[theme] ?? null;
  }

  export type LogType = "warn" | "error" | "load" | "none";
  export type LoaderOption = "warn" | "error" | "default";

  const theme = () => getThemeColors();

  function prefix(type: string) {
    return `[ ${type.toUpperCase()} ] `;
  }

  export function log(text: string): void;
  export function log(text: string, type: LogType): void;
  export function log(text: string, type: string): void;
  export function log(text: string, type: LogType | string = "info") {
    const colors = theme();
    if (type === "none") {
      process.stderr.write(text + "\n");
      return;
    }

    switch (type) {
      case "warn":
        process.stderr.write(colors.error("\r[ ERROR ] ") + text + "\n");
        break;

      case "error":
        console.log(chalk.bold.hex("#ff0000")(`[ ERROR ] `) + text + "\n");
        break;

      case "load":
        console.log(colors.subcolor(`[ NEW USER ] `) + text + "\n");
        break;

      default:
        process.stderr.write(
          colors.subcolor(`\r${prefix(type)}`) + text + "\n",
        );
        break;
    }
  }

  export function themed(text: string) {
    const colors = theme();
    process.stderr.write(colors.subcolor(`\r${text}`) + "\n");
  }

  export function error(error: unknown, type: string) {
    let text = error instanceof Error ? error.stack : inspect(error);
    process.stderr.write(chalk.hex("#ff0000")(`[ ${type} ] `) + text + "\n");
  }

  export function err(text: string, type: string) {
    process.stderr.write(
      getThemeColors().subcolor(`[ ${type} ] `) + text + "\n",
    );
  }

  export function warn(text: string, type: string) {
    process.stderr.write(
      getThemeColors().subcolor(`\r[ ${type} ] `) + text + "\n",
    );
  }

  export function loader(data: string, option: LoaderOption = "default") {
    const theme = getThemeColors();

    if (option === "warn") {
      process.stderr.write(theme.subcolor(`[ SYSTEM ]`) + data + "\n");
      return;
    }

    if (option === "error") {
      process.stderr.write(chalk.hex("#ff0000")(`[ SYSTEM ] `) + data + "\n");
      return;
    }

    console.log(theme.subcolor(`[ SYSTEM ]`), data);
  }
}

export default BotpackLogger;
