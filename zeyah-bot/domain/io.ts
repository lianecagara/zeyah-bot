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

export type MessageZeyahIO = ZeyahIO<ZeyahMessageOrReply>;

export class ZeyahIO<Ev extends ZeyahInferredEvent> {
  event: Ev;
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

  setThread(
    this: MessageZeyahIO,
    thread: null | ZeyahMessageOrReply["threadID"] = null,
  ) {
    this.#threadIDCustom = thread === null ? this.event.threadID : thread;
  }

  getThread(this: MessageZeyahIO) {
    return this.#threadIDCustom;
  }

  setReplyTo(
    this: MessageZeyahIO,
    replyTo: null | ZeyahMessageOrReply["messageID"] = null,
  ) {
    this.#messageIDCustom = replyTo === null ? this.event.messageID : replyTo;
  }

  getReplyTo(this: MessageZeyahIO) {
    return this.#messageIDCustom;
  }

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

  assertDangerousAPI<T extends AnyZeyahAdapterClass>(
    adapterClass: T,
  ): InstanceType<T>["internalAPI"] {
    if (this.adapter instanceof adapterClass) {
      return this.adapter.internalAPI;
    }
    throw new Error("Adapter mismatch.");
  }
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

  isMessage(): this is { event: ZeyahEventOf<"message" | "message_reply"> } {
    return this.eventType("message", "message_reply");
  }

  isMessageReply(): this is { event: ZeyahEventOf<"message_reply"> } {
    return this.eventType("message_reply");
  }

  getLogEvent(): ZeyahIO.ReturnedLogEvent<ZeyahLogEventType> | null {
    if (!this.eventType("event")) {
      return null;
    }
    return new ZeyahIO.ReturnedLogEvent(this.event);
  }

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

export namespace ZeyahIO {
  export type InternalAPIOf<T extends AnyZeyahAdapterClass> =
    InstanceType<T>["internalAPI"];

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

    getAuthor() {
      return this.author;
    }

    getBody() {
      return this.logMessageBody;
    }

    getData() {
      return this.logMessageData;
    }

    hasAuthor() {
      return this.author !== null && this.author !== undefined;
    }

    matchesAuthor(author: string) {
      return this.author === author;
    }

    isAnonymous() {
      return !this.author;
    }

    summary(maxLength = 120) {
      if (this.logMessageBody.length <= maxLength) {
        return this.logMessageBody;
      }

      return this.logMessageBody.slice(0, maxLength).trim() + "...";
    }

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

    isAdminEvent(): this is ReturnedLogEvent<"log:thread-admins"> {
      return this.logMessageType === "log:thread-admins";
    }

    isThreadNameEvent(): this is ReturnedLogEvent<"log:thread-name"> {
      return this.logMessageType === "log:thread-name";
    }

    isUserNicknameEvent(): this is ReturnedLogEvent<"log:user-nickname"> {
      return this.logMessageType === "log:user-nickname";
    }

    isThreadCallEvent(): this is ReturnedLogEvent<"log:thread-call"> {
      return this.logMessageType === "log:thread-call";
    }

    isThreadIconEvent(): this is ReturnedLogEvent<"log:thread-icon"> {
      return this.logMessageType === "log:thread-icon";
    }

    isThreadColorEvent(): this is ReturnedLogEvent<"log:thread-color"> {
      return this.logMessageType === "log:thread-color";
    }

    isLinkStatusEvent(): this is ReturnedLogEvent<"log:link-status"> {
      return this.logMessageType === "log:link-status";
    }

    isMagicWordsEvent(): this is ReturnedLogEvent<"log:magic-words"> {
      return this.logMessageType === "log:magic-words";
    }

    isThreadApprovalModeEvent(): this is ReturnedLogEvent<"log:thread-approval-mode"> {
      return this.logMessageType === "log:thread-approval-mode";
    }

    isThreadPollEvent(): this is ReturnedLogEvent<"log:thread-poll"> {
      return this.logMessageType === "log:thread-poll";
    }

    getAdminEvent(this: ReturnedLogEvent<"log:thread-admins">) {
      return this.logMessageData.ADMIN_EVENT;
    }

    getThreadName(this: ReturnedLogEvent<"log:thread-name">) {
      return this.logMessageData.name;
    }

    getUserNickname(this: ReturnedLogEvent<"log:user-nickname">) {
      return {
        participantId: this.logMessageData.participant_id,
        nickname: this.logMessageData.nickname,
      };
    }

    getCallCallerId(this: ReturnedLogEvent<"log:thread-call">) {
      return this.logMessageData.caller_id;
    }

    isVideoCall(this: ReturnedLogEvent<"log:thread-call">) {
      return !!this.logMessageData.video;
    }

    getCallDuration(this: ReturnedLogEvent<"log:thread-call">) {
      return this.logMessageData.call_duration;
    }

    getJoiningUser(this: ReturnedLogEvent<"log:thread-call">) {
      return this.logMessageData.joining_user ?? null;
    }

    getCallEventType(this: ReturnedLogEvent<"log:thread-call">) {
      return this.logMessageData.event;
    }

    getThreadIcon(this: ReturnedLogEvent<"log:thread-icon">) {
      return this.logMessageData.thread_icon;
    }

    getThreadColor(this: ReturnedLogEvent<"log:thread-color">) {
      return this.logMessageData.thread_color ?? null;
    }

    getMagicWord(this: ReturnedLogEvent<"log:magic-words">) {
      return this.logMessageData.magic_word;
    }

    getMagicTheme(this: ReturnedLogEvent<"log:magic-words">) {
      return this.logMessageData.theme_name;
    }

    getEmojiEffect(this: ReturnedLogEvent<"log:magic-words">) {
      return this.logMessageData.emoji_effect ?? null;
    }

    getNewMagicWordCount(this: ReturnedLogEvent<"log:magic-words">) {
      return this.logMessageData.new_magic_word_count;
    }

    getPollQuestionJson(this: ReturnedLogEvent<"log:thread-poll">) {
      return this.logMessageData.question_json;
    }

    getPollEventType(this: ReturnedLogEvent<"log:thread-poll">) {
      return this.logMessageData.event_type;
    }

    isThreadAdmins(): this is ReturnedLogEvent<"log:thread-admins"> {
      return this.logMessageType === "log:thread-admins";
    }

    isThreadName(): this is ReturnedLogEvent<"log:thread-name"> {
      return this.logMessageType === "log:thread-name";
    }

    isUserNickname(): this is ReturnedLogEvent<"log:user-nickname"> {
      return this.logMessageType === "log:user-nickname";
    }

    isThreadCall(): this is ReturnedLogEvent<"log:thread-call"> {
      return this.logMessageType === "log:thread-call";
    }

    isThreadIcon(): this is ReturnedLogEvent<"log:thread-icon"> {
      return this.logMessageType === "log:thread-icon";
    }

    isThreadColor(): this is ReturnedLogEvent<"log:thread-color"> {
      return this.logMessageType === "log:thread-color";
    }

    isLinkStatus(): this is ReturnedLogEvent<"log:link-status"> {
      return this.logMessageType === "log:link-status";
    }

    isMagicWords(): this is ReturnedLogEvent<"log:magic-words"> {
      return this.logMessageType === "log:magic-words";
    }

    isThreadApprovalMode(): this is ReturnedLogEvent<"log:thread-approval-mode"> {
      return this.logMessageType === "log:thread-approval-mode";
    }

    isThreadPoll(): this is ReturnedLogEvent<"log:thread-poll"> {
      return this.logMessageType === "log:thread-poll";
    }

    isAdminAdded(this: ReturnedLogEvent<"log:thread-admins">): boolean {
      return this.logMessageData.ADMIN_EVENT === "add_admin";
    }

    isAdminRemoved(this: ReturnedLogEvent<"log:thread-admins">): boolean {
      return this.logMessageData.ADMIN_EVENT === "remove_admin";
    }
  }
}
