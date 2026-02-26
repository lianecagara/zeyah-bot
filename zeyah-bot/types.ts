import { MessageZeyahIO, ZeyahIO } from "@zeyah-bot/domain/io";
import type { register } from "@zeyah-bot/registry";
import { UserDB, UsersDB } from "@zeyah-bot/database";
import { ThemeName } from "@zeyah-utils/logger-themes";
import Stream, { Readable } from "node:stream";
import { BufferResolvable } from "discord.js";
import { PlatformType } from "@kayelaa/zeyah";

// types.ts

/**
 * **ZeyahCMD** is an interface from **@zeyah-bot/types** that defines the structure of a valid and safe command object.
 *
 * All commands has to follow this shape or else the compiler won't run this whole project.
 *
 * For registering your custom command, use {@link register}
 *
 * *(Jsdoc fully written by lianecagara)*
 */
export interface ZeyahCMD<PluginNames extends ValidPluginNames> {
  emoji: string;
  /**
   * The **name** of the command, it **must** be unique.
   *
   * **DO NOT** put spaces in the command name.
   *
   * Having another command registered in the same name will likely cause an **error**
   */
  name: string;
  notCommand?: boolean;
  /**
   * These are the other names of the command, it **must** be unique.
   *
   * **DO NOT** put spaces in the aliases.
   *
   * Having another command registered in the same name will not cause an **error** but do avoid doing it, as it will get **overshadowed** by recent commands with the same alias.
   */
  aliases?: Array<ZeyahCMD<PluginNames>["name"]>;
  /**
   * **Semantic Version** of the command.
   *
   * Must follow a this format:
   *
   * *major.minor.patch*
   *
   * Any malformed strings will cause a **compilation error**.
   *
   */
  version: SemVerLiteral;
  /**
   * Github **USERNAMES** of the authors.
   *
   * The name should **start** with an **@** symbol.
   *
   * If there are **MULTIPLE** authors, please write it as an array instead.
   *
   * Any malformed strings will cause a **compilation error**.
   */
  author: GHUserLiteral | GHUserLiteral[];
  /**
   * **Permission level**. Allows a dev to **restrict** the command access to administrators and etc.
   *
   * This requires the **CMDRole** Enum, or you can also use the numbers in the enum.
   *
   * For reference, see {@link CMDRole}
   */
  role?: CMDRole;
  /**
   * Command **description** that'll be used by the help list, or discord slash hints.
   *
   * Avoid making it **too long** but also avoid making it **too vague**.
   */
  description?: string;
  /**
   * **Guide for Arguments**
   *
   * It must be an array with elements like <name> or [something].
   *
   * Any malformed strings will cause a **compilation error**.
   */
  argGuide?: ArgumentLiteral[];
  /**
   * Zeyah PREFIX Handling.
   *
   * **"required"** means the command will **NOT** respond anything if the command call matches the command name but there is no prefix.
   *
   * **"optional"** means the command will **WORK** regardless if there is a prefix or not, as long as the command name is **there**.
   */
  prefixMode?: "required" | "optional";
  /**
   * This is the **onCommand** handle.
   *
   * **DO NOT** manually annotate the parameters. The **ctx** object is automatically typed.
   *
   * The **ctx** parameter should be destructured immeditately.
   *
   * This executes whenever someone sends **a slash command, a normal command, as long as it is a valid command**.
   *
   * Supported event types: **"message" | "message_reply"**
   *
   * For the properties available in the **ctx**, refer to {@link ZeyahCMDCTX}
   */
  onCommand?(ctx: OnCommandCTX<PluginNames>): Promise<void>;
  /**
   * This is the **onEvent** handle.
   *
   * **DO NOT** manually annotate the parameters. The **ctx** object is automatically typed.
   *
   * The **ctx** parameter should be destructured immeditately.
   *
   * This executes whenever a bot receives a valid event.
   *
   * Checks for **event.type** is required for the sake of type inference (discriminated union.)
   *
   * ctx.event.type === "message"
   *
   * For the properties available in the **ctx**, refer to {@link ZeyahEventCTX}
   */
  onEvent?(ctx: PluginMergeContext<ZeyahEventCTX, PluginNames>): Promise<void>;
  /**
   * This is the **onMessage** handle.
   *
   * **DO NOT** manually annotate the parameters. The **ctx** object is automatically typed.
   *
   * The **ctx** parameter should be destructured immeditately.
   *
   * This executes whenever a bot receives a message.
   *
   * Supported event types: **"message" | "message_reply"**
   *
   * For the properties available in the **ctx**, refer to {@link ZeyahMessageCTX}
   */
  onMessage?(
    ctx: PluginMergeContext<ZeyahMessageCTX, PluginNames>,
  ): Promise<void>;

  pluginNames: readonly [...PluginNames];

  pluginConfig?: { [K in PluginNames[number]]?: PluginConfigOf<K> };

  platform?: PlatformType | null;
}

export type ValidPluginNames = readonly [...Array<keyof GlobalZeyahPlugins>];
export interface PluginContract {
  ctx: Record<string, unknown>;
  config: Record<string, unknown>;
}
export type OnCommandCTX<PluginNames extends ValidPluginNames> =
  PluginMergeContext<ZeyahCMDCTX, PluginNames> & {
    currentCommand: ZeyahCMD<PluginNames>;
  };
export interface ZeyahPluginDefineFunc<
  CustomCTX extends PluginContract["ctx"],
> {
  <T extends keyof CustomCTX>(ctxKey: T, value: CustomCTX[T]): boolean;
}
export interface ZeyahPluginCMDMutateFunc {
  (command: ZeyahCMD<any>): boolean;
}

export type PluginCTXOf<Name extends keyof GlobalZeyahPlugins> =
  GlobalZeyahPlugins[Name] extends PluginContract
    ? GlobalZeyahPlugins[Name]["ctx"]
    : Record<string, never>;

export type PluginCTX<Name extends keyof GlobalZeyahPlugins> =
  GlobalZeyahPlugins[Name] extends PluginContract
    ? GlobalZeyahPlugins[Name]["ctx"]
    : never;

export type PluginMergeContext<
  BaseCTX,
  Plugins extends ValidPluginNames,
> = Plugins extends readonly [infer Head, ...infer Tail]
  ? Head extends keyof GlobalZeyahPlugins
    ? Tail extends ValidPluginNames
      ? BaseCTX & PluginCTX<Head> & PluginMergeContext<BaseCTX, Tail>
      : BaseCTX & PluginCTX<Head>
    : BaseCTX
  : BaseCTX;

export interface ZeyahPlugin<
  Name extends keyof GlobalZeyahPlugins,
  Deps extends ValidPluginNames,
> {
  pluginName: Name;
  pluginDepNames: Deps;
  defaultConfig: PluginConfigOf<Name>;

  onBeforeHandlers?(
    define: ZeyahPluginDefineFunc<PluginCTXOf<Name>>,
    ctx: PluginMergeContext<ZeyahEventCTX, Deps>,
  ): Promise<void>;
  onMutateCurrentCommand?(
    configFromCommand: PluginConfigOf<Name>,
    define: ZeyahPluginDefineFunc<PluginCTXOf<Name>>,
    mutateCommand: ZeyahPluginCMDMutateFunc,
    ctx: PluginMergeContext<ZeyahCMDCTX, Deps>,
  ): Promise<void>;
}

export interface BaseZeyahPluginConfig {}

export type PluginConfigOf<Name extends keyof GlobalZeyahPlugins> =
  GlobalZeyahPlugins[Name] extends PluginContract
    ? GlobalZeyahPlugins[Name]["config"]
    : {};
export type PluginNameOf<Plugin extends ZeyahPlugin<any, any>> =
  Plugin extends ZeyahPlugin<infer Name, any> ? Name : never;

export type SemVerLiteral = `${number}.${number}.${number}`;

export type GHUserLiteral = `@${string}`;

export enum CMDRole {
  EVERYONE = 0,
  // ADMINBOX = 1,
  MODERATORBOT = 1.5,
  ADMINBOT = 2,
}

export type CMDRoleName = keyof typeof CMDRole;
export type StaticCMDRoleName = Exclude<CMDRoleName, "ADMINBOX">;

export type ArgumentLiteral = `<${string}>` | `[${string}]`;

export function isSemVerLiteral(str: string): str is SemVerLiteral {
  return /^\d+\.\d+\.\d+$/.test(str);
}

export function isGHUserLiteral(str: string): str is GHUserLiteral {
  return /^@.+$/.test(str);
}

export function isArgumentLiteral(str: string): str is ArgumentLiteral {
  return /^<.+>$/.test(str) || /^\[.+\]$/.test(str);
}

export interface ZeyahBaseCTX {
  event: ZeyahInferredEvent;
  zeyahIO: ZeyahIO<ZeyahInferredEvent>;
  role: CMDRole;
  usersDB: UsersDB;
  platform: PlatformType;
}

export interface ZeyahMessageCTX extends ZeyahBaseCTX {
  zeyahIO: MessageZeyahIO;
  event: ZeyahMessageOrReply;
  message: string;
  messageWords: string[];
  userDB: UserDB;
  ctx: ZeyahMessageCTX;
}
export interface ZeyahCMDCTX extends ZeyahMessageCTX {
  args: string[];
  hasPrefix: boolean;
  currentPrefix: string;
  commandName: string;
  currentCommand: ZeyahCMD<any>;
  event: ZeyahMessageOrReply;
  zeyahIO: MessageZeyahIO;
  commandProp: string | "";
  commandBase: string;
  runContextual(contextual: Interact.Contextual): Promise<void>;
  ctx: ZeyahCMDCTX;
}
export interface ZeyahEventCTX extends ZeyahBaseCTX {
  zeyahIO: ZeyahIO<ZeyahInferredEvent>;
  event: ZeyahInferredEvent;
  ctx: ZeyahEventCTX;
}

export interface ZeyahBaseEvent<Type extends string = string> {
  type: Type;
  extras: Map<string, unknown>;
}

export interface ZeyahLogEventData {
  "log:subscribe": {
    addedParticipants?: Array<{ userFbId: string; fullName: string }>;
  };
  "log:unsubscribe": {
    leftParticipantFbId?: string;
  };
  "log:thread-admins": {
    ADMIN_EVENT: "add_admin" | "remove_admin";
  };
  "log:thread-name": {
    name: string | Falsy;
  };
  "log:user-nickname": {
    participant_id: string;
    nickname: string;
  };
  "log:thread-call": {
    caller_id: string;
    video?: boolean;
    call_duration: number;
    joining_user?: string | Falsy;
    event: "group_call_started" | "group_call_ended";
    group_call_type?: "1" | never;
  };
  "log:thread-icon": {
    thread_icon: string;
  };
  "log:thread-color": {
    thread_color?: string | Falsy;
  };
  "log:link-status": {
    // use logMessageBody
  };
  "log:magic-words": {
    magic_word: string;
    theme_name: string;
    emoji_effect?: string | Falsy;
    new_magic_word_count: number;
  };
  "log:thread-approval-mode": {
    // use logMessageBody
  };
  "log:thread-poll": {
    question_json: string;
    event_type: "question_creation" | "update_vote";
  };
}

export type Falsy = null | 0 | "" | false | undefined | void;

export type ZeyahLogEventType = keyof ZeyahLogEventData;

export interface ZeyahLogEvent<
  Type extends ZeyahLogEventType,
> extends ZeyahBaseEvent<"event"> {
  logMessageType: Type;
  logMessageData: ZeyahLogEventData[Type];
  logMessageBody: string;
  author?: string;
}

export type ZeyahInferredLogEventData = ZeyahLogEventData[ZeyahLogEventType];

export type ZeyahInferredLogEvent = ZeyahLogEvent<ZeyahLogEventType>;

export type LooseReadableStream =
  | Readable
  | NodeJS.ReadableStream
  | ReadableStream
  | AsyncIterable<Uint8Array>
  | BufferResolvable
  | Stream;

export interface ZeyahDispatchAttachment {
  stream: LooseReadableStream;
  name: string;
}

export interface MessageProperties {
  senderID: string;
  threadID: string;
  messageID: string;
  body: string;
  mentions: Record<string, string>;
}

export interface ZeyahMessageEvent
  extends ZeyahBaseEvent<"message">, MessageProperties {
  messageReply?: ZeyahMessageEvent | undefined;
}
export interface ZeyahMessageReplyEvent
  extends ZeyahBaseEvent<"message_reply">, MessageProperties {
  messageReply: ZeyahMessageEvent;
}
export interface ZeyahMessageReaction extends ZeyahBaseEvent<"message_reaction"> {
  reaction: string;
  messageID: string;
  senderID: string;
  userID: string;
}

export type ZeyahInferredEvent =
  | ZeyahMessageEvent
  | ZeyahMessageReplyEvent
  | ZeyahMessageReaction
  | ZeyahInferredLogEvent;

export type ZeyahEventType = ZeyahInferredEvent["type"];

export type ZeyahEventOf<Type extends ZeyahInferredEvent["type"]> = Extract<
  ZeyahInferredEvent,
  { type: Type }
>;

export type ZeyahMessageOrReply = ZeyahMessageEvent | ZeyahMessageReplyEvent;

export interface ZeyahConfig {
  adminBot: string[];
  moderatorBot: string[];
  prefixes: [string, ...string[]];
  useFacebook: boolean;
  useDiscord: boolean;
  discordToken?: string;
  plugins: ZeyahPluginInit<any, any>[];
  pluginConfig: {
    [K in keyof GlobalZeyahPlugins]?: PluginConfigOf<K>;
  };
  /**
   * Design your own custom terminal Titlebar for the title and must contain no numbers.
   *
   * Customize your console effortlessly with various theme colors. Explore Aqua, Fiery, Blue, Orange, Pink, Red, Retro, Sunlight, Teen, Summer, Flower, Ghost, Purple, Rainbow, and Hacker themes to enhance your terminal logs.
   *
   * Ripped directly from **BotPack**.
   * @link https://github.com/YANDEVA/BotPack
   */
  DESIGN: {
    Title: string;
    Theme: ThemeName;
    Admin: string;
  };
  lang: LanguageType;
}

export type ZeyahPluginInit<
  Name extends keyof GlobalZeyahPlugins,
  Deps extends ValidPluginNames,
> = () => Promise<ZeyahPlugin<Name, Deps>>;
export type ZeyahDefinePluginInit<
  Name extends keyof GlobalZeyahPlugins,
  Deps extends ValidPluginNames,
> = () => Promise<ZeyahPlugin<Name, Deps>>;

export type FilterKeysByValue<T, Value> = {
  [K in keyof T]: T[K] extends Value ? K : never;
}[keyof T];

export type MutableEntriesLike<K, V> = [K, V][];

export namespace Interact {
  export type Ctx = ZeyahCMDCTX;

  export interface Contextual {
    runInContext(ctx: Ctx): Promise<void>;
  }
}

export type LanguageType =
  | "tl"
  | "ow"
  | "en"
  | "vi"
  | "bl"
  | "kr"
  | "sp"
  | "ja";

export type LanguageTypeWithFallback = LanguageType | "fallback";
