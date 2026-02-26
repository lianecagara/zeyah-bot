// registry.ts
import * as LoggerThemes from "@zeyah-utils/logger-themes";

export function defineConfig(config: ZeyahConfig): ZeyahConfig {
  if (
    !config.DESIGN ||
    !config.adminBot ||
    !config.prefixes ||
    !config.plugins ||
    !config.pluginConfig
  ) {
    throw new Error(
      "Malformed config file. Make sure it follows the correct type interface or shape.",
    );
  }
  const themeName = config.DESIGN.Theme;
  if (!themeName || !LoggerThemes.ThemeMap[themeName]) {
    throw new Error(
      `Invalid theme name. Available themes: ${Object.keys(LoggerThemes.ThemeMap).join(", ")}`,
    );
  }
  return config;
}
import config from "@config";
export { config };

import {
  BaseZeyahPluginConfig,
  CMDRole,
  CMDRoleName,
  isArgumentLiteral,
  isGHUserLiteral,
  isSemVerLiteral,
  PluginConfigOf,
  PluginNameOf,
  SemVerLiteral,
  StaticCMDRoleName,
  ValidPluginNames,
  ZeyahCMD,
  ZeyahConfig,
  ZeyahDefinePluginInit,
  ZeyahPlugin,
  ZeyahPluginInit,
} from "@zeyah-bot/types";
import { inspect } from "util";
import { readdir } from "fs/promises";
import path from "path";
import { logger } from "@zeyah-utils/logger";
import { pathToFileURL } from "url";
import { AnyZeyahAdapterClass, ZeyahAdapter } from "@zeyah-bot/adapters/base";

export type CommandNameWithVersion = `${string}@${SemVerLiteral}`;

const commands = new Map<CommandNameWithVersion, ZeyahCMD<any>>();

/**
 * **register()** is a method from **@zeyah-bot/registry** that allows a developer to register their custom **commands** to the system.
 *
 * Each 'register' call will **register** a command to a dedicated **internal map**, the return value can be discarded but it's best to export it.
 *
 * To get the commands, use {@link getCallableCommands}.
 *
 * Re-registering a command with the same 'name' property will cause an **error**.
 *
 * *(Jsdoc fully written by lianecagara)*
 */
export function register<T extends ValidPluginNames>(cmd: ZeyahCMD<T>): void;
export function register<T extends ValidPluginNames>(cmd: ZeyahCMD<T>): void {
  const normalAuthor = (
    Array.isArray(cmd.author) ? [...cmd.author] : [cmd.author]
  ).filter(Boolean);
  if (normalAuthor.length === 0) {
    throw new Error("Command must have at least one author.");
  }
  cmd.pluginNames ??= [] as unknown as readonly [...T];
  if (cmd.pluginNames.some((i) => !Plugins.some((p) => p.pluginName === i))) {
    throw new Error(
      `Some plugins this command requests doesnt exist in our plugin registry.`,
    );
  }
  if (normalAuthor.some((i) => !isGHUserLiteral(i))) {
    throw new Error(
      "The command authors must be a github username with '@' prefix. Example: '@lianecagara'",
    );
  }
  if (!cmd.version || !SemanticVersion.isValid(cmd.version)) {
    throw new Error(
      "The version is either missing or does not satisfy the format of 'number.number.number' or semantic versioning. Example: '1.0.2'",
    );
  }
  if (!cmd.emoji) {
    throw new Error("The emoji property is required.");
  }
  if (
    cmd.argGuide &&
    (!Array.isArray(cmd.argGuide) ||
      cmd.argGuide.some((i) => !isArgumentLiteral(i)))
  ) {
    throw new Error(
      "Some argument guide in the command is malformed, each arg guide could start and end with <, > or [, ] respectively.",
    );
  }
  if (!cmd.name) {
    throw new Error("Command must have a name");
  }
  if (!cmd.onCommand && !cmd.onEvent && !cmd.onMessage) {
    throw new Error(`Command "${cmd.name}" has no handlers`);
  }
  if (getCommandByVersion(cmd.name, cmd.version)) {
    throw new Error(`Duplicate command version: ${cmd.name}`);
  }

  const key = cmd.name;
  commands.set(`${key}@${cmd.version}`, cmd);
  logger.loader(`${key}@${cmd.version} | Registered!`);
}

export function getCommandByVersion(name: string, version: SemVerLiteral) {
  return getAnyCommands().find((i) => i.name === name && i.version === version);
}

export function registerAdapter(
  type: keyof typeof AdapterInstanceRegistry,
  adapter: ZeyahAdapter,
): void {
  AdapterInstanceRegistry[type] = adapter;
  logger.loader(
    `${adapter.constructor.name} (Adapter for ${type}) | Registered!`,
  );
}

export function getCallableCommands(): ZeyahCMD<any>[] {
  return Array.from(commands.values()).filter(
    (i) => !i.notCommand && i.onCommand,
  );
}
export function getAnyCommands(): ZeyahCMD<any>[] {
  return Array.from(commands.values());
}

export function definePlugin<
  Name extends keyof GlobalZeyahPlugins,
  Deps extends ValidPluginNames,
>(init: ZeyahDefinePluginInit<Name, Deps>): ZeyahPluginInit<Name, Deps> {
  return () => {
    return init();
  };
}

export function getPluginConfig<Name extends keyof GlobalZeyahPlugins>(
  name: Name,
): PluginConfigOf<Name> {
  const plugin: ZeyahPlugin<Name, any> = Plugins.find(
    (i) => i.pluginName === name,
  );
  return config.pluginConfig[plugin.pluginName] ?? plugin?.defaultConfig ?? {};
}

export const commandDir = path.join(__dirname, "../commands");

export async function loadAllCommands() {
  logger.loader("Loading commands...");

  try {
    const files = await readdir(commandDir);

    for (const fileName of files.filter((i) => isValidFileEXT(i))) {
      try {
        logger.loader(`Loading file: ${fileName}`);

        const res = await module.hub.import(
          pathToFileURL(path.resolve(commandDir, fileName)).href,
        );
        if (res) {
          if ("config" in res && "run" in res) {
            logger.warn(
              "Zeyah-bot does not support module.exports directly for Mirai/Botpack modules. Consider replacing 'module.exports.config' with 'module.mirai.config' or use module.exportAsMirai(); at the end of the file.",
              "Mirai",
            );
          }
        }
      } catch (error) {
        logger.error(error, "Load Error");
      }
    }
    for (const mirai of MiraiModule.moduleMiraiMap.values()) {
      logger.loader(
        `Mirai Module detected: ${mirai?.config?.name ?? "No name"}`,
      );
      const zeyah = MiraiModule.convertMiraiToZeyah(mirai);
      register(zeyah);
    }
    MiraiModule.moduleMiraiMap.clear();

    logger.log(`All commands loaded (${commands.size} total`);
  } catch (error) {
    logger.error(error, "Load CMD Error");
  }
}

export function isValidFileEXT(fileName: string): boolean {
  return [".tsx", ".ts", ".js", ".jsx", ".cjs"].some((i) =>
    fileName.endsWith(i),
  );
}

export async function loadAllAdapters() {
  for (const adapter of Object.values(AdapterInstanceRegistry)) {
    try {
      adapter.listen();
      logger.loader(`(${adapter.constructor.name}) Adapter Listened.`);
    } catch (error) {
      logger.error(error, "Adapter");
    }
  }
}

export function getConfig(): ZeyahConfig {
  return config;
}
import { Error } from "mongoose";
import { API } from "ws3-fca";
import { MiraiModule } from "@zeyah-bot/legacy/catch-mirai";
import { Client } from "discord.js";
import axios from "axios";

export function getStaticRole(id: string): CMDRole {
  if (config.moderatorBot.includes(id)) {
    return CMDRole.MODERATORBOT;
  }
  if (config.adminBot.includes(id)) {
    return CMDRole.ADMINBOT;
  }
  return CMDRole.EVERYONE;
}
export function getRoleName(role: CMDRole): CMDRoleName {
  return Object.keys(CMDRole).find(
    (key) => CMDRole[key as CMDRoleName] === role,
  ) as CMDRoleName;
}

export const Plugins: ZeyahPlugin<any, any>[] = [];

export async function loadAllPlugins() {
  logger.loader("Loading plugins...");

  try {
    for (const plugin of config.plugins) {
      const result = await plugin();
      Plugins.push(result);
      logger.loader(`Plugin loaded: ${result.pluginName}`);
    }

    logger.log(`All plugins loaded (${Plugins.length} total`);
  } catch (error) {
    logger.error(error, "Plugin");
  }
}

export class SemanticVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;

  constructor(major: number, minor: number, patch: number);
  constructor(version: string);
  constructor(version: string | number, minor?: number, patch?: number) {
    if (typeof version === "string") {
      const match = version.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?$/);

      if (!match) {
        throw new Error(`Invalid version: ${version}`);
      }

      const maj = Number(match[1]);
      const min = Number(match[2] ?? 0);
      const pat = Number(match[3] ?? 0);

      this.major = maj;
      this.minor = min;
      this.patch = pat;
    } else {
      if (
        !Number.isInteger(version) ||
        !Number.isInteger(minor) ||
        !Number.isInteger(patch)
      ) {
        throw new Error("Invalid numeric version parts");
      }

      this.major = version;
      this.minor = minor!;
      this.patch = patch!;
    }
  }

  static parse(v: string) {
    return new SemanticVersion(v);
  }

  toString(): SemVerLiteral {
    return `${this.major}.${this.minor}.${this.patch}`;
  }

  static isValid(version: string): boolean {
    const semverRegex =
      /^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;

    return semverRegex.test(version);
  }

  compare(other: SemanticVersion): number {
    if (this.major !== other.major) return this.major - other.major;

    if (this.minor !== other.minor) return this.minor - other.minor;

    return this.patch - other.patch;
  }

  equals(other: SemanticVersion): boolean {
    return this.compare(other) === 0;
  }

  greaterThan(other: SemanticVersion): boolean {
    return this.compare(other) > 0;
  }

  lessThan(other: SemanticVersion): boolean {
    return this.compare(other) < 0;
  }

  greaterOrEqual(other: SemanticVersion): boolean {
    return this.compare(other) >= 0;
  }

  lessOrEqual(other: SemanticVersion): boolean {
    return this.compare(other) <= 0;
  }

  // -------- static helpers --------

  static compare(a: SemanticVersion, b: SemanticVersion): number {
    return a.compare(b);
  }

  static sort<T>(
    array: T[],
    mapper: (item: T) => SemanticVersion,
    direction: "asc" | "desc" = "asc",
  ): T[] {
    const copy = [...array];

    copy.sort((a, b) => {
      const result = mapper(a).compare(mapper(b));
      return direction === "asc" ? result : -result;
    });

    return copy;
  }
}

export async function fetchRepoPackageVersion(
  username: string,
  repoName: string,
): Promise<string> {
  const url = `https://raw.githubusercontent.com/${username}/${repoName}/main/package.json`;

  const response = await axios.get(url, {
    responseType: "json",
    timeout: 10000,
  });

  return response.data?.version;
}

export async function compareRepoVersion(
  username: string,
  repoName: string,
  packageObject: { version: string },
): Promise<number> {
  const repoVersionString = await fetchRepoPackageVersion(username, repoName);

  if (
    !SemanticVersion.isValid(repoVersionString) ||
    !SemanticVersion.isValid(packageObject.version)
  ) {
    throw new Error("Invalid semantic version format");
  }

  const repoVersion = SemanticVersion.parse(repoVersionString);
  const packageVersion = SemanticVersion.parse(packageObject.version);

  return SemanticVersion.compare(repoVersion, packageVersion);
}

let _preloadedCommandsVersion = new Map<string, ZeyahCMD<any>[]>();

function normalizeKey(name: string) {
  return name.toLowerCase().trim();
}

export function preloadCommandsVersion(commands: ZeyahCMD<any>[]) {
  const map = new Map<string, ZeyahCMD<any>[]>();

  for (const cmd of commands) {
    if (cmd.notCommand) continue;
    const keys = new Set<string>();

    keys.add(normalizeKey(cmd.name));

    if (cmd.aliases?.length) {
      for (const alias of cmd.aliases) {
        keys.add(normalizeKey(alias));
      }
    }

    const sortedCommands = map.get(cmd.name) ?? [];

    sortedCommands.push(cmd);
    map.set(cmd.name, sortedCommands);

    for (const alias of cmd.aliases ?? []) {
      const arr = map.get(alias) ?? [];
      arr.push(cmd);
      map.set(alias, arr);
    }
  }

  for (const [key, arr] of map.entries()) {
    map.set(
      key,
      SemanticVersion.sort(
        arr,
        (cmd) => SemanticVersion.parse(cmd.version),
        "desc",
      ),
    );
  }

  _preloadedCommandsVersion = map;
}

export function refreshPreloadCommandsVersion(commands: ZeyahCMD<any>[]) {
  preloadCommandsVersion(commands);
}

export function getPreloadedCommandsVersion() {
  return _preloadedCommandsVersion;
}

export namespace AdapterRegistry {
  export let Facebook: AnyZeyahAdapterClass<API>;
  export let Discord: AnyZeyahAdapterClass<Client>;
}
export namespace AdapterInstanceRegistry {
  export let Facebook: ZeyahAdapter;
  export let Discord: ZeyahAdapter;
}

export function findCommand(input: string) {
  const normalized = input.toLowerCase().trim();

  const [rawName, versionPart] = normalized.split("@");
  const version = versionPart?.trim();

  const namesToTry = new Set<string>();

  namesToTry.add(rawName);

  if (rawName.includes("-")) {
    namesToTry.add(rawName.split("-")[0]);
  }

  const registry = getPreloadedCommandsVersion();

  let candidates: ZeyahCMD<any>[] = [];

  for (const name of namesToTry) {
    const list = registry.get(name);
    if (list?.length) {
      candidates.push(...list);
    }
  }

  if (!candidates.length) return undefined;

  candidates = Array.from(new Set(candidates));

  if (version && version !== "latest") {
    return candidates.find((cmd) => cmd.version === version);
  }

  return candidates[0];
}

export const HOME_DIR = path.resolve(__dirname, "..");
