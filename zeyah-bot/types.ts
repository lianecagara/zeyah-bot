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
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export interface ZeyahCMD<PluginNames extends ValidPluginNames = []> {
  /**
   * The **emoji** of the command.
   *
   * This is used for visual representation in help menus and other UI elements.
   *
   * It is **required** for a command to be valid.
   */
  emoji: string;
  /**
   * The **name** of the command, it **must** be unique.
   *
   * **DO NOT** put spaces in the command name.
   *
   * Having another command registered in the same name will likely cause an **error**
   */
  name: string;
  /**
   * Indicates if this is **not** a command.
   *
   * If set to **true**, this command will not be included in the callable command list.
   *
   * Useful for internal event handlers that use the command registry.
   */
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
  onCommand?(ctx: OnCommandCTX<PluginNames>): Promise<any>;
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
  onEvent?(ctx: PluginMergeContext<ZeyahEventCTX, PluginNames>): Promise<any>;
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
  ): Promise<any>;

  /**
   * The names of the **plugins** this command depends on.
   *
   * These plugins must be registered in the system for the command to work.
   */
  pluginNames?: readonly [...PluginNames];

  /**
   * Custom **configuration** for the plugins used by this command.
   */
  pluginConfig?: { [K in PluginNames[number]]?: PluginConfigOf<K> };

  /**
   * The **platform** where this command is available.
   *
   * If **null**, it is available on all platforms.
   *
   * For reference, see {@link PlatformType}
   */
  platform?: PlatformType | null;
}

/**
 * **ValidPluginNames** is a type from **@zeyah-bot/types** that represents a list of valid plugin names.
 *
 * It is derived from the keys of **GlobalZeyahPlugins**.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type ValidPluginNames = readonly [...Array<keyof GlobalZeyahPlugins>];

/**
 * **PluginContract** is an interface from **@zeyah-bot/types** that defines the shape of a plugin's context and configuration.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export interface PluginContract {
  /**
   * The **context** object that the plugin provides.
   */
  ctx: Record<string, unknown>;
  /**
   * The **configuration** object that the plugin uses.
   */
  config: Record<string, unknown>;
}

/**
 * **OnCommandCTX** is a type from **@zeyah-bot/types** that defines the context object passed to the **onCommand** handle.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type OnCommandCTX<PluginNames extends ValidPluginNames> =
  PluginMergeContext<ZeyahCMDCTX, PluginNames> & {
    /**
     * The **current command** being executed.
     */
    currentCommand: ZeyahCMD<PluginNames>;
  };

/**
 * **ZeyahPluginDefineFunc** is a type from **@zeyah-bot/types** that defines the function used to define context keys in a plugin.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export interface ZeyahPluginDefineFunc<
  CustomCTX extends PluginContract["ctx"],
> {
  <T extends keyof CustomCTX>(ctxKey: T, value: CustomCTX[T]): boolean;
}

/**
 * **ZeyahPluginCMDMutateFunc** is a type from **@zeyah-bot/types** that defines the function used to mutate a command in a plugin.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export interface ZeyahPluginCMDMutateFunc {
  (command: ZeyahCMD<any>): boolean;
}

/**
 * **PluginCTXOf** is a type from **@zeyah-bot/types** that extracts the context type from a plugin.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type PluginCTXOf<Name extends keyof GlobalZeyahPlugins> =
  GlobalZeyahPlugins[Name] extends PluginContract
    ? GlobalZeyahPlugins[Name]["ctx"]
    : Record<string, never>;

/**
 * **PluginCTX** is a type from **@zeyah-bot/types** that extracts the context type from a plugin, or returns **never** if it's not a valid plugin.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type PluginCTX<Name extends keyof GlobalZeyahPlugins> =
  GlobalZeyahPlugins[Name] extends PluginContract
    ? GlobalZeyahPlugins[Name]["ctx"]
    : never;

/**
 * **PluginMergeContext** is a type from **@zeyah-bot/types** that merges multiple plugin contexts into a base context.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
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

/**
 * **ZeyahPlugin** is an interface from **@zeyah-bot/types** that defines the structure of a valid plugin.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export interface ZeyahPlugin<
  Name extends keyof GlobalZeyahPlugins,
  Deps extends ValidPluginNames,
> {
  /**
   * The **name** of the plugin.
   */
  pluginName: Name;
  /**
   * The **names** of the plugins this plugin depends on.
   */
  pluginDepNames: Deps;
  /**
   * The **default configuration** for the plugin.
   */
  defaultConfig: PluginConfigOf<Name>;

  /**
   * This is the **onBeforeHandlers** handle.
   *
   * It executes before any other handlers.
   */
  onBeforeHandlers?(
    define: ZeyahPluginDefineFunc<PluginCTXOf<Name>>,
    ctx: PluginMergeContext<ZeyahEventCTX, Deps>,
  ): Promise<void>;
  /**
   * This is the **onMutateCurrentCommand** handle.
   *
   * It allows the plugin to mutate the current command before it's executed.
   */
  onMutateCurrentCommand?(
    configFromCommand: PluginConfigOf<Name>,
    define: ZeyahPluginDefineFunc<PluginCTXOf<Name>>,
    mutateCommand: ZeyahPluginCMDMutateFunc,
    ctx: PluginMergeContext<ZeyahCMDCTX, Deps>,
  ): Promise<void>;
}

/**
 * **BaseZeyahPluginConfig** is an empty interface from **@zeyah-bot/types** used as a base for plugin configurations.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export interface BaseZeyahPluginConfig {}

/**
 * **PluginConfigOf** is a type from **@zeyah-bot/types** that extracts the configuration type from a plugin.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type PluginConfigOf<Name extends keyof GlobalZeyahPlugins> =
  GlobalZeyahPlugins[Name] extends PluginContract
    ? GlobalZeyahPlugins[Name]["config"]
    : {};
/**
 * **PluginNameOf** is a type from **@zeyah-bot/types** that extracts the name of a plugin.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type PluginNameOf<Plugin extends ZeyahPlugin<any, any>> =
  Plugin extends ZeyahPlugin<infer Name, any> ? Name : never;

/**
 * **SemVerLiteral** is a type from **@zeyah-bot/types** that represents a semantic version string.
 *
 * Format: *major.minor.patch*
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type SemVerLiteral = `${number}.${number}.${number}`;

/**
 * **GHUserLiteral** is a type from **@zeyah-bot/types** that represents a GitHub username.
 *
 * Format: *@username*
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type GHUserLiteral = `@${string}`;

/**
 * **CMDRole** is an enum from **@zeyah-bot/types** that defines the permission levels for commands.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export enum CMDRole {
  EVERYONE = 0,
  // ADMINBOX = 1,
  MODERATORBOT = 1.5,
  ADMINBOT = 2,
}

/**
 * **CMDRoleName** is a type from **@zeyah-bot/types** that represents the names of the CMDRole enum.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type CMDRoleName = keyof typeof CMDRole;
/**
 * **StaticCMDRoleName** is a type from **@zeyah-bot/types** that represents the names of the CMDRole enum, excluding **ADMINBOX**.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type StaticCMDRoleName = Exclude<CMDRoleName, "ADMINBOX">;

/**
 * **ArgumentLiteral** is a type from **@zeyah-bot/types** that represents a command argument.
 *
 * Format: `<name>` or `[name]`
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type ArgumentLiteral = `<${string}>` | `[${string}]`;

/**
 * **isSemVerLiteral** is a function from **@zeyah-bot/types** that checks if a string is a valid **SemVerLiteral**.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export function isSemVerLiteral(str: string): str is SemVerLiteral {
  return /^\d+\.\d+\.\d+$/.test(str);
}

/**
 * **isGHUserLiteral** is a function from **@zeyah-bot/types** that checks if a string is a valid **GHUserLiteral**.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export function isGHUserLiteral(str: string): str is GHUserLiteral {
  return /^@.+$/.test(str);
}

/**
 * **isArgumentLiteral** is a function from **@zeyah-bot/types** that checks if a string is a valid **ArgumentLiteral**.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export function isArgumentLiteral(str: string): str is ArgumentLiteral {
  return /^<.+>$/.test(str) || /^\[.+\]$/.test(str);
}

/**
 * **ZeyahBaseCTX** is an interface from **@zeyah-bot/types** that defines the base context for all events.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export interface ZeyahBaseCTX {
  /**
   * The **event** that triggered this context.
   */
  event: ZeyahInferredEvent;
  /**
   * The **I/O** interface for interacting with the platform.
   */
  zeyahIO: ZeyahIO<ZeyahInferredEvent>;
  /**
   * The **role** of the user who triggered the event.
   */
  role: CMDRole;
  /**
   * Access to the **users database**.
   */
  usersDB: UsersDB;
  /**
   * The **platform** where the event occurred.
   */
  platform: PlatformType;
}

/**
 * **ZeyahMessageCTX** is an interface from **@zeyah-bot/types** that defines the context for message events.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export interface ZeyahMessageCTX extends ZeyahBaseCTX {
  /**
   * Specialized **I/O** for message events.
   */
  zeyahIO: MessageZeyahIO;
  /**
   * The **message event** or **message reply event**.
   */
  event: ZeyahMessageOrReply;
  /**
   * The **raw message** content.
   */
  message: string;
  /**
   * The message content split into **words**.
   */
  messageWords: string[];
  /**
   * Access to the **user database** for the sender.
   */
  userDB: UserDB;
  /**
   * A reference to the **context** itself.
   */
  ctx: ZeyahMessageCTX;
}

/**
 * **ZeyahCMDCTX** is an interface from **@zeyah-bot/types** that defines the context for command execution.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export interface ZeyahCMDCTX extends ZeyahMessageCTX {
  /**
   * The **arguments** passed to the command.
   */
  args: string[];
  /**
   * Indicates if the command call **has a prefix**.
   */
  hasPrefix: boolean;
  /**
   * The **prefix** used to call the command.
   */
  currentPrefix: string;
  /**
   * The **name** of the command being called.
   */
  commandName: string;
  /**
   * The **command object** being executed.
   */
  currentCommand: ZeyahCMD<any>;
  /**
   * The **message event** that triggered the command.
   */
  event: ZeyahMessageOrReply;
  /**
   * Specialized **I/O** for message events.
   */
  zeyahIO: MessageZeyahIO;
  /**
   * The **property** of the command being accessed, if any.
   */
  commandProp: string | "";
  /**
   * The **base** of the command name.
   */
  commandBase: string;
  /**
   * Runs a **contextual** interaction.
   */
  runContextual(contextual: Interact.Contextual): Promise<void>;
  /**
   * A reference to the **context** itself.
   */
  ctx: ZeyahCMDCTX;
}

/**
 * **ZeyahEventCTX** is an interface from **@zeyah-bot/types** that defines the context for general events.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export interface ZeyahEventCTX extends ZeyahBaseCTX {
  /**
   * The **I/O** interface for interacting with the platform.
   */
  zeyahIO: ZeyahIO<ZeyahInferredEvent>;
  /**
   * The **event** that triggered this context.
   */
  event: ZeyahInferredEvent;
  /**
   * A reference to the **context** itself.
   */
  ctx: ZeyahEventCTX;
}

/**
 * **ZeyahBaseEvent** is an interface from **@zeyah-bot/types** that defines the base structure for all events.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export interface ZeyahBaseEvent<Type extends string = string> {
  /**
   * The **type** of the event.
   */
  type: Type;
  /**
   * **Extra** data associated with the event.
   */
  extras: Map<string, unknown>;
}

/**
 * **ZeyahLogEventData** is an interface from **@zeyah-bot/types** that defines the data for various log events.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export interface ZeyahLogEventData {
  /**
   * Triggered when a participant is **added** to a thread.
   */
  "log:subscribe": {
    /**
     * The list of **participants** who were added.
     */
    addedParticipants?: Array<{ userFbId: string; fullName: string }>;
  };
  /**
   * Triggered when a participant **leaves** or is **removed** from a thread.
   */
  "log:unsubscribe": {
    /**
     * The **ID** of the participant who left.
     */
    leftParticipantFbId?: string;
  };
  /**
   * Triggered when thread **administrators** are added or removed.
   */
  "log:thread-admins": {
    /**
     * The **admin event** type.
     */
    ADMIN_EVENT: "add_admin" | "remove_admin";
  };
  /**
   * Triggered when the thread **name** is changed.
   */
  "log:thread-name": {
    /**
     * The **new name** of the thread.
     */
    name: string | Falsy;
  };
  /**
   * Triggered when a user's **nickname** is changed.
   */
  "log:user-nickname": {
    /**
     * The **ID** of the participant whose nickname was changed.
     */
    participant_id: string;
    /**
     * The **new nickname**.
     */
    nickname: string;
  };
  /**
   * Triggered during thread **calls**.
   */
  "log:thread-call": {
    /**
     * The **ID** of the caller.
     */
    caller_id: string;
    /**
     * Indicates if it was a **video** call.
     */
    video?: boolean;
    /**
     * The **duration** of the call.
     */
    call_duration: number;
    /**
     * The **user** who joined the call.
     */
    joining_user?: string | Falsy;
    /**
     * The **event** type.
     */
    event: "group_call_started" | "group_call_ended";
    /**
     * The **type** of group call.
     */
    group_call_type?: "1" | never;
  };
  /**
   * Triggered when the thread **icon** is changed.
   */
  "log:thread-icon": {
    /**
     * The **new icon**.
     */
    thread_icon: string;
  };
  /**
   * Triggered when the thread **color** is changed.
   */
  "log:thread-color": {
    /**
     * The **new color**.
     */
    thread_color?: string | Falsy;
  };
  /**
   * Triggered when a link's **status** changes.
   */
  "log:link-status": {
    // use logMessageBody
  };
  /**
   * Triggered when **magic words** are used.
   */
  "log:magic-words": {
    /**
     * The **magic word** that was used.
     */
    magic_word: string;
    /**
     * The **theme name** associated with the magic word.
     */
    theme_name: string;
    /**
     * The **emoji effect** of the magic word.
     */
    emoji_effect?: string | Falsy;
    /**
     * The **new count** of magic word uses.
     */
    new_magic_word_count: number;
  };
  /**
   * Triggered when thread **approval mode** is changed.
   */
  "log:thread-approval-mode": {
    // use logMessageBody
  };
  /**
   * Triggered when a thread **poll** is created or updated.
   */
  "log:thread-poll": {
    /**
     * The **JSON** string representing the question.
     */
    question_json: string;
    /**
     * The **event type**.
     */
    event_type: "question_creation" | "update_vote";
  };
}

/**
 * **Falsy** is a type from **@zeyah-bot/types** that represents all falsy values.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type Falsy = null | 0 | "" | false | undefined | void;

/**
 * **ZeyahLogEventType** is a type from **@zeyah-bot/types** that represents the keys of **ZeyahLogEventData**.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type ZeyahLogEventType = keyof ZeyahLogEventData;

/**
 * **ZeyahLogEvent** is an interface from **@zeyah-bot/types** that defines the structure for log events.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export interface ZeyahLogEvent<
  Type extends ZeyahLogEventType,
> extends ZeyahBaseEvent<"event"> {
  /**
   * The **type** of log message.
   */
  logMessageType: Type;
  /**
   * The **data** associated with the log message.
   */
  logMessageData: ZeyahLogEventData[Type];
  /**
   * The **body** of the log message.
   */
  logMessageBody: string;
  /**
   * The **author** of the log event, if any.
   */
  author?: string;
}

/**
 * **ZeyahInferredLogEventData** is a type from **@zeyah-bot/types** that represents the data for any log event.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type ZeyahInferredLogEventData = ZeyahLogEventData[ZeyahLogEventType];

/**
 * **ZeyahInferredLogEvent** is a type from **@zeyah-bot/types** that represents any log event.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type ZeyahInferredLogEvent = ZeyahLogEvent<ZeyahLogEventType>;

/**
 * **LooseReadableStream** is a type from **@zeyah-bot/types** that represents various readable stream types.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type LooseReadableStream =
  | Readable
  | NodeJS.ReadableStream
  | ReadableStream
  | AsyncIterable<Uint8Array>
  | BufferResolvable
  | Stream;

/**
 * **ZeyahDispatchAttachment** is an interface from **@zeyah-bot/types** that defines an attachment to be dispatched.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export interface ZeyahDispatchAttachment {
  /**
   * The **stream** of the attachment.
   */
  stream: LooseReadableStream;
  /**
   * The **name** of the attachment.
   */
  name: string;
}

/**
 * **MessageProperties** is an interface from **@zeyah-bot/types** that defines the properties of a message.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export interface MessageProperties {
  /**
   * The **ID** of the sender.
   */
  senderID: string;
  /**
   * The **ID** of the thread.
   */
  threadID: string;
  /**
   * The **ID** of the message.
   */
  messageID: string;
  /**
   * The **body** of the message.
   */
  body: string;
  /**
   * The **mentions** in the message.
   */
  mentions: Record<string, string>;
}

/**
 * **ZeyahMessageEvent** is an interface from **@zeyah-bot/types** that defines a message event.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export interface ZeyahMessageEvent
  extends ZeyahBaseEvent<"message">, MessageProperties {
  /**
   * The **message reply** associated with this event, if any.
   */
  messageReply?: ZeyahMessageEvent | undefined;
}

/**
 * **ZeyahMessageReplyEvent** is an interface from **@zeyah-bot/types** that defines a message reply event.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export interface ZeyahMessageReplyEvent
  extends ZeyahBaseEvent<"message_reply">, MessageProperties {
  /**
   * The **message** being replied to.
   */
  messageReply: ZeyahMessageEvent;
}

/**
 * **ZeyahMessageReaction** is an interface from **@zeyah-bot/types** that defines a message reaction event.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export interface ZeyahMessageReaction extends ZeyahBaseEvent<"message_reaction"> {
  /**
   * The **reaction** emoji.
   */
  reaction: string;
  /**
   * The **ID** of the message that was reacted to.
   */
  messageID: string;
  /**
   * The **ID** of the sender of the reaction.
   */
  senderID: string;
  /**
   * The **ID** of the user who reacted.
   */
  userID: string;
}

/**
 * **ZeyahInferredEvent** is a type from **@zeyah-bot/types** that represents any valid event.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type ZeyahInferredEvent =
  | ZeyahMessageEvent
  | ZeyahMessageReplyEvent
  | ZeyahMessageReaction
  | ZeyahInferredLogEvent;

/**
 * **ZeyahEventType** is a type from **@zeyah-bot/types** that represents the type of any event.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type ZeyahEventType = ZeyahInferredEvent["type"];

/**
 * **ZeyahEventOf** is a type from **@zeyah-bot/types** that extracts a specific event type.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type ZeyahEventOf<Type extends ZeyahInferredEvent["type"]> = Extract<
  ZeyahInferredEvent,
  { type: Type }
>;

/**
 * **ZeyahMessageOrReply** is a type from **@zeyah-bot/types** that represents either a message or a message reply.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type ZeyahMessageOrReply = ZeyahMessageEvent | ZeyahMessageReplyEvent;

/**
 * **ZeyahConfig** is an interface from **@zeyah-bot/types** that defines the system configuration.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export interface ZeyahConfig {
  /**
   * The **IDs** of the bot administrators.
   */
  adminBot: string[];
  /**
   * The **IDs** of the bot moderators.
   */
  moderatorBot: string[];
  /**
   * The **prefixes** used to trigger commands.
   */
  prefixes: [string, ...string[]];
  /**
   * Indicates if the bot should use **Facebook**.
   */
  useFacebook: boolean;
  /**
   * Indicates if the bot should use **Discord**.
   */
  useDiscord: boolean;
  /**
   * The **token** for the Discord bot.
   */
  discordToken?: string;
  /**
   * The **plugins** to be initialized.
   */
  plugins: ZeyahPluginInit<any, any>[];
  /**
   * The **configuration** for each plugin.
   */
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
    /**
     * The **title** of the terminal window.
     */
    Title: string;
    /**
     * The **theme** color for the terminal logs.
     */
    Theme: ThemeName;
    /**
     * The **administrator** name shown in the terminal.
     */
    Admin: string;
  };
  /**
   * The **language** setting for the bot.
   */
  lang: LanguageType;
}

/**
 * **ZeyahPluginInit** is a type from **@zeyah-bot/types** that defines a plugin initialization function.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type ZeyahPluginInit<
  Name extends keyof GlobalZeyahPlugins,
  Deps extends ValidPluginNames,
> = () => Promise<ZeyahPlugin<Name, Deps>>;

/**
 * **ZeyahDefinePluginInit** is a type from **@zeyah-bot/types** that defines a plugin definition function.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type ZeyahDefinePluginInit<
  Name extends keyof GlobalZeyahPlugins,
  Deps extends ValidPluginNames,
> = () => Promise<ZeyahPlugin<Name, Deps>>;

/**
 * **FilterKeysByValue** is a utility type from **@zeyah-bot/types** that filters keys of an object by their value type.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type FilterKeysByValue<T, Value> = {
  [K in keyof T]: T[K] extends Value ? K : never;
}[keyof T];

/**
 * **MutableEntriesLike** is a type from **@zeyah-bot/types** that represents a list of key-value pairs.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type MutableEntriesLike<K, V> = [K, V][];

/**
 * **Interact** is a namespace from **@zeyah-bot/types** that contains types for interactive elements.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export namespace Interact {
  /**
   * Type alias for **ZeyahCMDCTX**.
   */
  export type Ctx = ZeyahCMDCTX;

  /**
   * **Contextual** is an interface from **@zeyah-bot/types** for objects that can run in a context.
   */
  export interface Contextual {
    /**
     * Runs the interaction in the provided **context**.
     */
    runInContext(ctx: Ctx): Promise<void>;
  }
}

/**
 * **LanguageType** is a type from **@zeyah-bot/types** that represents supported languages.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type LanguageType =
  | "tl"
  | "ow"
  | "en"
  | "vi"
  | "bl"
  | "kr"
  | "sp"
  | "ja";

/**
 * **LanguageTypeWithFallback** is a type from **@zeyah-bot/types** that represents supported languages including a fallback.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type LanguageTypeWithFallback = LanguageType | "fallback";
