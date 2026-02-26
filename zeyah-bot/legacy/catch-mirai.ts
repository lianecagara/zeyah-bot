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

import { PlatformType } from "@kayelaa/zeyah";
import { ZeyahIO } from "@zeyah-bot/domain/io";
import {
  AdapterRegistry,
  getConfig,
  SemanticVersion,
} from "@zeyah-bot/registry";
import {
  CMDRole,
  LanguageType,
  ZeyahCMD,
  ZeyahCMDCTX,
  ZeyahMessageOrReply,
} from "@zeyah-bot/types";
import { Never } from "@zeyah-utils";
import Module from "node:module";

export interface MiraiModule {
  config: MiraiModule.Config;
  run(ctx: MiraiModule.CTXRun): any;
  languages?: {
    [K in LanguageType]?: Record<string, string>;
  };
}

export namespace MiraiModule {
  export interface Config {
    name: string;
    version?: number | string;
    credits?: string;
    hasPermssion?: CMDRole;
    hasPermission?: CMDRole;
    commandCategory?: string;
    cooldowns?: number;
    usePrefix?: boolean;
    description?: string;
    usages?: string;
    platform?: PlatformType;
  }
  export interface CTXRun extends ZeyahCMDCTX {
    api: ZeyahIO.InternalAPIOf<typeof AdapterRegistry.Facebook>;
    event: ZeyahMessageOrReply;
    args: string[];
    /**
     * @deprecated
     */
    getText(key: string): string | null;
    /**
     * @deprecated
     */
    Users: never;
    zeyahCtx: ZeyahCMDCTX;
  }

  export function convertMiraiToZeyah(cmd: MiraiModule): ZeyahCMD<any> {
    const config = cmd.config ?? { name: "???" };
    const langs = cmd.languages ?? {};
    const getText: MiraiModule.CTXRun["getText"] = (key) => {
      const config = getConfig();
      const currentLang =
        langs[config.lang] ?? langs.en ?? Object.values(langs).at(0) ?? {};
      return Reflect.get(currentLang, key) ?? null;
    };
    const mod: ZeyahCMD<[]> = {
      emoji: "📄",
      name: config.name ?? "???",
      author: config.credits
        ? `@${String(config.credits).replace(/\s+/g, "-")}`
        : "@unknown",
      pluginNames: [],
      version:
        (typeof config.version === "number" ||
          typeof config.version === "string") &&
        SemanticVersion.isValid(config.version.toString())
          ? new SemanticVersion(config.version.toString()).toString()
          : `1.0.0`,
      prefixMode: config.usePrefix === false ? "optional" : "required",
      role: config.hasPermssion ?? config.hasPermission ?? 0,
      description: config.description ?? undefined,
      async onCommand(zeyahCtx) {
        const apiFB = zeyahCtx.zeyahIO.getNullableDangerousAPI(
          AdapterRegistry.Facebook,
        );
        cmd.run({
          ...zeyahCtx,
          api: apiFB,
          args: zeyahCtx.args,
          event: zeyahCtx.event,
          getText,
          Users: Never,
          zeyahCtx,
        });
      },
      platform: config.platform ?? "facebook",
    };
    return mod;
  }

  export const moduleMiraiMap = new Map<string, MiraiModule>();
}

Object.defineProperty(Module.Module.prototype, "mirai", {
  set(this: NodeJS.Module, value: MiraiModule) {
    const key = `${this.meta.dirname}`;
    MiraiModule.moduleMiraiMap.set(key, value);
  },
  get(this: NodeJS.Module) {
    const key = `${this.meta.dirname}`;

    let mirai = MiraiModule.moduleMiraiMap.get(key);
    if (!mirai) {
      mirai = { config: { name: "" }, run() {} };
      MiraiModule.moduleMiraiMap.set(key, mirai);
    }
    return mirai;
  },
  configurable: true,
});
Object.defineProperty(Module.Module.prototype, "exportAsMirai", {
  get(this: NodeJS.Module) {
    return () => {
      this.mirai = this.exports;
      this.exports.__esModule = true;
    };
  },
  configurable: true,
});
