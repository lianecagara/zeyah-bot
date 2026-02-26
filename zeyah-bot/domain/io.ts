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

import { ZeyahElement } from "@kayelaa/zeyah";
import { AnyZeyahAdapterClass, ZeyahAdapter } from "@zeyah-bot/adapters/base";
import {
  ZeyahEventOf,
  ZeyahEventType,
  ZeyahInferredEvent,
  ZeyahInferredLogEvent,
  ZeyahInferredLogEventData,
  ZeyahLogEvent,
  ZeyahLogEventType,
  ZeyahMessageEvent,
  ZeyahMessageOrReply,
} from "@zeyah-bot/types";
import { inspect } from "node:util";

/**
 * **MessageZeyahIO** is a type alias for **ZeyahIO** specialized for message-related events.
 */
export type MessageZeyahIO = ZeyahIO<ZeyahMessageOrReply>;

/**
 * **ZeyahIO** is a class from **@zeyah-bot/domain/io** that provides a high-level API for interacting with different platforms.
 *
 * It abstracts away the platform-specific details, allowing you to send, reply, and unsend messages easily.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export class ZeyahIO<Ev extends ZeyahInferredEvent> {
  /**
   * The **event** that triggered this I/O instance.
   */
  event: Ev;
  /**
   * The **adapter** being used for this I/O instance.
   */
  adapter: ZeyahAdapter;

  constructor(event: Ev, adapter: ZeyahAdapter) {
    this.event = event;
    this.adapter = adapter;
    if (this.event.type === "message" || this.event.type === "message_reply") {
      (this as unknown as MessageZeyahIO).setThread(this.event.threadID);
      (this as unknown as MessageZeyahIO).setReplyTo(this.event.messageID);
    }
  }

  static $instanceSymbol = Symbol("io_has_instance");

  protected $instanceSymbol = ZeyahIO.$instanceSymbol;

  static [Symbol.hasInstance](obj: any) {
    return (
      !!obj?.$instanceSymbol && obj.$instanceSymbol === ZeyahIO.$instanceSymbol
    );
  }

  #threadIDCustom: ZeyahMessageOrReply["threadID"];
  #messageIDCustom: ZeyahMessageOrReply["messageID"];

  /**
   * Sets a custom **thread ID** for future dispatches.
   *
   * If **null**, it defaults to the thread ID of the current event.
   */
  setThread(
    this: MessageZeyahIO,
    thread: null | ZeyahMessageOrReply["threadID"] = null,
  ) {
    this.#threadIDCustom = thread === null ? this.event.threadID : thread;
  }

  /**
   * Gets the current **thread ID** used for dispatches.
   */
  getThread(this: MessageZeyahIO) {
    return this.#threadIDCustom;
  }

  /**
   * Sets a custom **message ID** to reply to for future dispatches.
   *
   * If **null**, it defaults to the message ID of the current event.
   */
  setReplyTo(
    this: MessageZeyahIO,
    replyTo: null | ZeyahMessageOrReply["messageID"] = null,
  ) {
    this.#messageIDCustom = replyTo === null ? this.event.messageID : replyTo;
  }

  /**
   * Gets the current **message ID** used for replies.
   */
  getReplyTo(this: MessageZeyahIO) {
    return this.#messageIDCustom;
  }

  /**
   * **dispatch()** is a low-level method to send content to the platform.
   *
   * It is recommended to use {@link reply} or {@link send} for common tasks.
   *
   * @example
   * ```ts
   * ctx.zeyahIO.dispatch({
   *   body: "Hello World",
   *   thread: ctx.event.threadID
   * });
   * ```
   *
   * @throws Will throw an error if the target thread ID is missing.
   */
  dispatch(form: ZeyahAdapter.DispatchForm): ZeyahAdapter.ZeyahDispatched;
  dispatch(
    body: ZeyahAdapter.DispatchBody,
    form: ZeyahAdapter.DispatchFormNoBody,
  ): ZeyahAdapter.ZeyahDispatched;

  dispatch(
    this: ZeyahIO<Ev>,
    formOrBody: ZeyahAdapter.DispatchForm,
    form2?: ZeyahAdapter.DispatchFormNoBody,
  ): ZeyahAdapter.ZeyahDispatched {
    const form: ZeyahAdapter.DispatchFormStrict =
      typeof formOrBody === "string" || formOrBody instanceof ZeyahElement
        ? {
            body: formOrBody,
            ...(typeof form2 === "object" && form2 ? form2 : {}),
          }
        : {
            ...formOrBody,
            ...(typeof form2 === "object" && form2 ? form2 : {}),
          };
    if (!form.thread) {
      throw new Error("Missing target thread ID.");
    }
    const result = this.adapter.onDispatch(this as any, this.event, form);
    return result;
  }

  /**
   * **reply()** sends a message as a reply to the current event.
   *
   * @example
   * ```ts
   * ctx.zeyahIO.reply("This is a reply!");
   * ```
   *
   * **WARNING:** This method will **throw** if called on non-message events (e.g., log events).
   *
   * @throws Will throw an error if the event is not a message or message_reply.
   * @throws Will throw an error if the target replyTo ID is missing.
   */
  reply(
    form: ZeyahAdapter.DispatchForm,
    replyTo = this.#messageIDCustom,
    thread = this.#threadIDCustom,
  ): ZeyahAdapter.ZeyahDispatched {
    if (!this.isMessage()) {
      throw new Error(
        "ZeyahIO.reply(...) will only work to message/message_reply events.",
      );
    }
    const normal = ZeyahAdapter.normalizeForm(form);
    normal.replyTo ??= replyTo;
    normal.thread ??= thread;
    if (!normal.replyTo) {
      throw new Error("Missing target replyTo ID.");
    }

    const result = this.dispatch({
      ...normal,
      replyTo: replyTo ?? normal.replyTo,
      thread: thread ?? normal.thread,
    });
    return result;
  }

  /**
   * **send()** sends a message to the current thread without replying.
   *
   * @example
   * ```ts
   * ctx.zeyahIO.send("Hello everyone!");
   * ```
   *
   * @throws Will throw an error if no thread ID is provided for non-message events.
   */
  send(
    form: Omit<ZeyahAdapter.DispatchForm, "replyTo">,
    thread = this.#threadIDCustom,
  ): ZeyahAdapter.ZeyahDispatched {
    const normal = ZeyahAdapter.normalizeForm(form);
    normal.thread ??= thread;
    if (!this.isMessage() && !normal.thread) {
      throw new Error(
        "ZeyahIO.send(...) needs a target threadID for non message/message_reply events.",
      );
    }
    const result = this.dispatch({
      ...normal,
      replyTo: null,
      thread: thread ?? normal.thread,
    });
    return result;
  }

  /**
   * **unsend()** removes a message from the platform.
   *
   * @example
   * ```ts
   * const sent = await ctx.zeyahIO.send("I will disappear!");
   * await ctx.zeyahIO.unsend(sent);
   * ```
   */
  unsend(
    this: MessageZeyahIO,
    dispatched: ZeyahAdapter.NoPromiseZeyahDispatched,
  ): Promise<void>;
  unsend(
    this: MessageZeyahIO,
    messageID: ZeyahMessageEvent["messageID"],
    threadID?: ZeyahMessageEvent["threadID"],
  ): Promise<void>;
  unsend(
    this: MessageZeyahIO,
    messageID:
      | ZeyahMessageEvent["messageID"]
      | ZeyahAdapter.NoPromiseZeyahDispatched,
    threadID?: ZeyahMessageEvent["threadID"],
  ): Promise<void> {
    if (messageID && messageID instanceof ZeyahAdapter.ZeyahDispatched) {
      return this.adapter.onUnsend(
        this,
        this.event,
        messageID.messageID,
        messageID.threadID ?? this.getThread(),
      );
    }
    messageID = String(messageID);
    return this.adapter.onUnsend(
      this,
      this.event,
      messageID,
      threadID ?? this.getThread(),
    );
  }

  /**
   * **assertDangerousAPI()** allows access to the underlying platform-specific API (e.g., discord.js Client or ws3-fca API).
   *
   * **WARNING:** Using this makes your command platform-dependent and potentially unsafe. Use with caution!
   *
   * @throws Will throw an error if the adapter class does not match.
   */
  assertDangerousAPI<T extends AnyZeyahAdapterClass>(
    adapterClass: T,
  ): InstanceType<T>["internalAPI"] {
    if (this.adapter instanceof adapterClass) {
      return this.adapter.internalAPI;
    }
    throw new Error("Adapter mismatch.");
  }
  /**
   * **getNullableDangerousAPI()** is similar to {@link assertDangerousAPI} but returns **null** instead of throwing.
   */
  getNullableDangerousAPI<T extends AnyZeyahAdapterClass>(
    adapterClass: T,
  ): InstanceType<T>["internalAPI"] {
    if (this.adapter instanceof adapterClass) {
      return this.adapter.internalAPI;
    }
    throw null;
  }

  protected formatError(err: string | any): string;

  protected formatError(error: any) {
    let errorMessage = "❌ | An error has occurred:\n";

    if (error instanceof Error) {
      const { name, message, stack, ...rest } = error;

      if (stack) errorMessage += `${stack}\n`;

      for (const key in rest) {
        if (Object.prototype.hasOwnProperty.call(rest, key)) {
          errorMessage += `${key}: ${Reflect.get(rest, key)}\n`;
        }
      }
    } else {
      errorMessage += inspect(error, { depth: null, showHidden: true });
    }

    return errorMessage;
  }

  /**
   * **error()** sends an error message to the platform.
   *
   * It formats the error object into a readable message.
   */
  error(err: unknown | string | Error): ZeyahAdapter.ZeyahDispatched {
    let error = err;
    if (typeof error !== "object" && typeof error !== "string") {
      throw new Error(
        `The first argument must be an Error instance or a string.`,
      );
    }
    if (typeof error === "string") {
      error = new Error(`${error}`);
    }
    const errMsg = this.formatError(error);
    return this.reply(errMsg);
  }

  /**
   * **eventType()** checks or returns the type of the current event.
   *
   * It can be used as a type guard for type inference.
   */
  eventType(): Ev["type"];
  eventType<T extends ZeyahEventType>(
    ...checks: T[]
  ): this is { event: ZeyahEventOf<T> };
  eventType(...args: ZeyahEventType[]) {
    if (args.length === 0) {
      return this.event.type;
    }
    return args.includes(this.event.type);
  }

  /**
   * Checks if the event is a **message** or **message reply**.
   */
  isMessage(): this is { event: ZeyahEventOf<"message" | "message_reply"> } {
    return this.eventType("message", "message_reply");
  }

  /**
   * Checks if the event is a **message reply**.
   */
  isMessageReply(): this is { event: ZeyahEventOf<"message_reply"> } {
    return this.eventType("message_reply");
  }

  /**
   * Gets the **log event** wrapper if the current event is a log event.
   *
   * Returns **null** otherwise.
   */
  getLogEvent(): ZeyahIO.ReturnedLogEvent<ZeyahLogEventType> | null {
    if (!this.eventType("event")) {
      return null;
    }
    return new ZeyahIO.ReturnedLogEvent(this.event);
  }

  /**
   * Gets the **sender ID** of a referenced user.
   *
   * Checks for mentions or message replies.
   */
  getRefSenderID(): string | null {
    let id: string = null;
    if (this.isMessage()) {
      id = Object.keys(this.event.mentions ?? {})[0];
    }
    if (!id && this.eventType("message_reply")) {
      id = this.event.messageReply.senderID;
    }
    return id;
  }
}

/**
 * **ZeyahIO** namespace contains utility types and classes related to ZeyahIO.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export namespace ZeyahIO {
  /**
   * Extracts the **internal API** type from an adapter class.
   */
  export type InternalAPIOf<T extends AnyZeyahAdapterClass> =
    InstanceType<T>["internalAPI"];

  /**
   * **ReturnedLogEvent** is a wrapper for log events that provides helper methods to access log data.
   *
   * *(Jsdoc fully written by jules with help of lianecagara)*
   */
  export class ReturnedLogEvent<Type extends ZeyahLogEventType> {
    private author: string;

    private logMessageBody: string;
    private logMessageData: ZeyahLogEvent<Type>["logMessageData"];
    private logMessageType: ZeyahLogEvent<Type>["logMessageType"];

    constructor(event: ZeyahLogEvent<Type>) {
      this.author = event.author ?? null;
      this.logMessageData = event.logMessageData;
      this.logMessageBody = event.logMessageBody;
      this.logMessageType = event.logMessageType;
    }

    /**
     * Gets the **author** of the log event.
     */
    getAuthor() {
      return this.author;
    }

    /**
     * Gets the **body** of the log message.
     */
    getBody() {
      return this.logMessageBody;
    }

    /**
     * Gets the raw **log message data**.
     */
    getData() {
      return this.logMessageData;
    }

    /**
     * Checks if the log event **has an author**.
     */
    hasAuthor() {
      return this.author !== null && this.author !== undefined;
    }

    /**
     * Checks if the log event **matches** the given author ID.
     */
    matchesAuthor(author: string) {
      return this.author === author;
    }

    /**
     * Checks if the log event is **anonymous** (no author).
     */
    isAnonymous() {
      return !this.author;
    }

    /**
     * Returns a **summary** of the log message body, truncated if necessary.
     */
    summary(maxLength = 120) {
      if (this.logMessageBody.length <= maxLength) {
        return this.logMessageBody;
      }

      return this.logMessageBody.slice(0, maxLength).trim() + "...";
    }

    /**
     * Checks or returns the **log type**.
     */
    logType(): Type;
    logType<T extends ZeyahLogEventType>(
      ...types: T[]
    ): this is ReturnedLogEvent<T>;
    logType(...types: ZeyahLogEventType[]) {
      if (types.length === 0) {
        return this.logMessageType;
      }

      return types.includes(this.logMessageType);
    }

    /**
     * Checks if it's a **thread admins** event.
     */
    isAdminEvent(): this is ReturnedLogEvent<"log:thread-admins"> {
      return this.logMessageType === "log:thread-admins";
    }

    /**
     * Checks if it's a **thread name** event.
     */
    isThreadNameEvent(): this is ReturnedLogEvent<"log:thread-name"> {
      return this.logMessageType === "log:thread-name";
    }

    /**
     * Checks if it's a **user nickname** event.
     */
    isUserNicknameEvent(): this is ReturnedLogEvent<"log:user-nickname"> {
      return this.logMessageType === "log:user-nickname";
    }

    /**
     * Checks if it's a **thread call** event.
     */
    isThreadCallEvent(): this is ReturnedLogEvent<"log:thread-call"> {
      return this.logMessageType === "log:thread-call";
    }

    /**
     * Checks if it's a **thread icon** event.
     */
    isThreadIconEvent(): this is ReturnedLogEvent<"log:thread-icon"> {
      return this.logMessageType === "log:thread-icon";
    }

    /**
     * Checks if it's a **thread color** event.
     */
    isThreadColorEvent(): this is ReturnedLogEvent<"log:thread-color"> {
      return this.logMessageType === "log:thread-color";
    }

    /**
     * Checks if it's a **link status** event.
     */
    isLinkStatusEvent(): this is ReturnedLogEvent<"log:link-status"> {
      return this.logMessageType === "log:link-status";
    }

    /**
     * Checks if it's a **magic words** event.
     */
    isMagicWordsEvent(): this is ReturnedLogEvent<"log:magic-words"> {
      return this.logMessageType === "log:magic-words";
    }

    /**
     * Checks if it's a **thread approval mode** event.
     */
    isThreadApprovalModeEvent(): this is ReturnedLogEvent<"log:thread-approval-mode"> {
      return this.logMessageType === "log:thread-approval-mode";
    }

    /**
     * Checks if it's a **thread poll** event.
     */
    isThreadPollEvent(): this is ReturnedLogEvent<"log:thread-poll"> {
      return this.logMessageType === "log:thread-poll";
    }

    /**
     * Gets the **admin event** type (e.g., add_admin, remove_admin).
     */
    getAdminEvent(this: ReturnedLogEvent<"log:thread-admins">) {
      return this.logMessageData.ADMIN_EVENT;
    }

    /**
     * Gets the **new thread name**.
     */
    getThreadName(this: ReturnedLogEvent<"log:thread-name">) {
      return this.logMessageData.name;
    }

    /**
     * Gets the **participant ID** and **new nickname**.
     */
    getUserNickname(this: ReturnedLogEvent<"log:user-nickname">) {
      return {
        participantId: this.logMessageData.participant_id,
        nickname: this.logMessageData.nickname,
      };
    }

    /**
     * Gets the **caller ID** for a thread call.
     */
    getCallCallerId(this: ReturnedLogEvent<"log:thread-call">) {
      return this.logMessageData.caller_id;
    }

    /**
     * Checks if it was a **video call**.
     */
    isVideoCall(this: ReturnedLogEvent<"log:thread-call">) {
      return !!this.logMessageData.video;
    }

    /**
     * Gets the **duration** of the call.
     */
    getCallDuration(this: ReturnedLogEvent<"log:thread-call">) {
      return this.logMessageData.call_duration;
    }

    /**
     * Gets the **joining user** ID for a thread call.
     */
    getJoiningUser(this: ReturnedLogEvent<"log:thread-call">) {
      return this.logMessageData.joining_user ?? null;
    }

    /**
     * Gets the **call event type** (e.g., group_call_started, group_call_ended).
     */
    getCallEventType(this: ReturnedLogEvent<"log:thread-call">) {
      return this.logMessageData.event;
    }

    /**
     * Gets the **new thread icon**.
     */
    getThreadIcon(this: ReturnedLogEvent<"log:thread-icon">) {
      return this.logMessageData.thread_icon;
    }

    /**
     * Gets the **new thread color**.
     */
    getThreadColor(this: ReturnedLogEvent<"log:thread-color">) {
      return this.logMessageData.thread_color ?? null;
    }

    /**
     * Gets the **magic word** used.
     */
    getMagicWord(this: ReturnedLogEvent<"log:magic-words">) {
      return this.logMessageData.magic_word;
    }

    /**
     * Gets the **theme name** for the magic word.
     */
    getMagicTheme(this: ReturnedLogEvent<"log:magic-words">) {
      return this.logMessageData.theme_name;
    }

    /**
     * Gets the **emoji effect** for the magic word.
     */
    getEmojiEffect(this: ReturnedLogEvent<"log:magic-words">) {
      return this.logMessageData.emoji_effect ?? null;
    }

    /**
     * Gets the **new count** for magic word uses.
     */
    getNewMagicWordCount(this: ReturnedLogEvent<"log:magic-words">) {
      return this.logMessageData.new_magic_word_count;
    }

    /**
     * Gets the **question JSON** for a thread poll.
     */
    getPollQuestionJson(this: ReturnedLogEvent<"log:thread-poll">) {
      return this.logMessageData.question_json;
    }

    /**
     * Gets the **poll event type** (e.g., question_creation, update_vote).
     */
    getPollEventType(this: ReturnedLogEvent<"log:thread-poll">) {
      return this.logMessageData.event_type;
    }

    /**
     * Checks if it's a **thread admins** event.
     */
    isThreadAdmins(): this is ReturnedLogEvent<"log:thread-admins"> {
      return this.logMessageType === "log:thread-admins";
    }

    /**
     * Checks if it's a **thread name** event.
     */
    isThreadName(): this is ReturnedLogEvent<"log:thread-name"> {
      return this.logMessageType === "log:thread-name";
    }

    /**
     * Checks if it's a **user nickname** event.
     */
    isUserNickname(): this is ReturnedLogEvent<"log:user-nickname"> {
      return this.logMessageType === "log:user-nickname";
    }

    /**
     * Checks if it's a **thread call** event.
     */
    isThreadCall(): this is ReturnedLogEvent<"log:thread-call"> {
      return this.logMessageType === "log:thread-call";
    }

    /**
     * Checks if it's a **thread icon** event.
     */
    isThreadIcon(): this is ReturnedLogEvent<"log:thread-icon"> {
      return this.logMessageType === "log:thread-icon";
    }

    /**
     * Checks if it's a **thread color** event.
     */
    isThreadColor(): this is ReturnedLogEvent<"log:thread-color"> {
      return this.logMessageType === "log:thread-color";
    }

    /**
     * Checks if it's a **link status** event.
     */
    isLinkStatus(): this is ReturnedLogEvent<"log:link-status"> {
      return this.logMessageType === "log:link-status";
    }

    /**
     * Checks if it's a **magic words** event.
     */
    isMagicWords(): this is ReturnedLogEvent<"log:magic-words"> {
      return this.logMessageType === "log:magic-words";
    }

    /**
     * Checks if it's a **thread approval mode** event.
     */
    isThreadApprovalMode(): this is ReturnedLogEvent<"log:thread-approval-mode"> {
      return this.logMessageType === "log:thread-approval-mode";
    }

    /**
     * Checks if it's a **thread poll** event.
     */
    isThreadPoll(): this is ReturnedLogEvent<"log:thread-poll"> {
      return this.logMessageType === "log:thread-poll";
    }

    /**
     * Checks if an **administrator was added**.
     */
    isAdminAdded(this: ReturnedLogEvent<"log:thread-admins">): boolean {
      return this.logMessageData.ADMIN_EVENT === "add_admin";
    }

    /**
     * Checks if an **administrator was removed**.
     */
    isAdminRemoved(this: ReturnedLogEvent<"log:thread-admins">): boolean {
      return this.logMessageData.ADMIN_EVENT === "remove_admin";
    }
  }
}
