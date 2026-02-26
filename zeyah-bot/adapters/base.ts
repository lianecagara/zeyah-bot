import { ZeyahIO } from "@zeyah-bot/domain/io";
import {
  ZeyahBaseEvent,
  ZeyahDispatchAttachment,
  ZeyahInferredEvent,
  ZeyahMessageEvent,
  ZeyahMessageReaction,
  ZeyahMessageReplyEvent,
} from "@zeyah-bot/types";
import Stream from "node:stream";
import Emitter from "node:events";
import {
  AnyZeyahElement,
  PlatformType,
  ZeyahElement,
  ZeyahNode,
} from "@kayelaa/zeyah";
import { ReadStream } from "node:fs";
import { handleCommand, handleEvent } from "@zeyah-bot/domain/handlers";
import { logger } from "@zeyah-utils/logger";
import { inspect } from "node:util";

export type AnyZeyahAdapterClass<Internal = unknown> = {
  new (...args: any[]): ZeyahAdapter & { internalAPI: Internal };
};
export abstract class ZeyahAdapter extends Emitter<ZeyahAdapter.AdapterEventMap> {
  platformType: PlatformType;
  constructor() {
    super();
    this.platformType = "unspecified";
    this.internalAPI = null;
    this.on("event", this.eventHandler);
  }

  eventHandler = async (ev: ZeyahInferredEvent) => {
    try {
      await handleEvent(ev, this);
    } catch (error) {
      logger.error(error, "Event");
    }

    if (ev.type === "message" || ev.type === "message_reply") {
      handleCommand(ev, this);
    }
  };

  listen() {
    this.onStartListen();
  }

  stopListening() {
    this.onStopListen();
  }

  abstract onStartListen(): void;
  abstract onStopListen(): void;

  public internalAPI: unknown;

  abstract onDispatch(
    facadeIO: ZeyahIO<ZeyahInferredEvent>,
    event: ZeyahInferredEvent,
    form: ZeyahAdapter.DispatchFormStrict,
  ): ZeyahAdapter.ZeyahDispatched;

  abstract onUnsend(
    facadeIO: ZeyahIO<ZeyahInferredEvent>,
    event: ZeyahInferredEvent,
    messageID: ZeyahMessageEvent["messageID"],
    threadID: ZeyahMessageEvent["threadID"],
  ): Promise<void>;

  triggerEvent(event: ZeyahInferredEvent, err?: Error): void {
    this.emit("event", event, err);
  }

  abstract onResolveUsername(
    identifier: string,
  ): Promise<string>;
}

export namespace ZeyahAdapter {
  export interface AdapterEventMap {
    event: [ZeyahInferredEvent, Error?];
  }
  export type DispatchForm = DispatchBody | DispatchFormStrict;

  export type DispatchBody = AnyZeyahElement | string;

  export interface DispatchFormStrict {
    body?: DispatchBody;
    attachments?: ZeyahDispatchAttachment[];
    forceAsText?: boolean;
    thread?: string;
    replyTo?: string;
  }

  export interface SuppliedDispatchForm extends DispatchFormStrict {
    finalBody: string;
    thread: string;
    replyTo: string;
  }

  export type DispatchFormNoBody = Omit<DispatchFormStrict, "body">;

  export interface DispatchedEventMap {
    reply: [ZeyahIO<ZeyahMessageReplyEvent>, ZeyahMessageReplyEvent];
    reaction: [ZeyahIO<ZeyahMessageReaction>, ZeyahMessageReaction];
  }

  export type NoPromiseZeyahDispatched = Omit<ZeyahDispatched, "then">;

  export abstract class ZeyahDispatched
    extends Emitter<DispatchedEventMap>
    implements PromiseLike<NoPromiseZeyahDispatched>
  {
    protected promiseInternal: Promise<ZeyahDispatched>;

    error: null | any;

    #ready: boolean;

    isReady() {
      return this.#ready;
    }

    protected adapter: ZeyahAdapter;

    protected setFormProperty<K extends keyof DispatchFormStrict>(
      _prop: K,
      _val: DispatchFormStrict[K],
    ): this {
      return this;
    }

    setAttachments(attachments: DispatchFormStrict["attachments"]): this {
      this.setFormProperty("attachments", attachments);
      return this;
    }

    setBody(body: DispatchFormStrict["body"]): this {
      this.setFormProperty("body", body);
      return this;
    }

    setThread(thread: DispatchFormStrict["thread"]): this {
      this.setFormProperty("body", thread);
      return this;
    }

    setReplyTo(thread: DispatchFormStrict["replyTo"]): this {
      this.setFormProperty("replyTo", thread);
      return this;
    }

    constructor(adapter: ZeyahAdapter) {
      super();
      this.adapter = adapter;
      const self = this;
      this.promiseInternal = new Promise<ZeyahDispatched>((resolve, reject) => {
        self.resolveInternal = (val) => {
          self.then = null;
          resolve(val);
        };
        self.rejectInternal = reject;
      });
      this.#ready = false;
      this.error = null;
    }

    protected resolveInternal(
      _value: ZeyahDispatched | PromiseLike<ZeyahDispatched>,
    ) {
      console.log("bugggged", new Error().stack);
    }
    protected rejectInternal(_reason?: any) {
      console.log("bugggged", new Error().stack);
    }

    then = <TResult1 = NoPromiseZeyahDispatched, TResult2 = never>(
      onfulfilled?: (
        value: NoPromiseZeyahDispatched,
      ) => TResult1 | PromiseLike<TResult1>,
      onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>,
    ) => {
      return this.promiseInternal.then(onfulfilled, onrejected);
    };

    messageID: DispatchedInfo["messageID"];
    timestamp: DispatchedInfo["timestamp"];
    threadID: DispatchedInfo["threadID"];

    protected abstract onListenReply({ timeout }: { timeout: number }): void;
    protected abstract onUnlistenReply(): void;
    protected abstract onListenReactions({
      timeout,
    }: {
      timeout: number;
    }): void;
    protected abstract onUnlistenReations(): void;

    protected abstract onReady(): void;

    __resolveResponse(info: DispatchedInfo | null, err?: any) {
      if (this.isReady()) {
        throw new Error("Already resolved.");
      }
      if (err) {
        this.error = err;
        this.rejectInternal(err);
        return;
      }
      this.#ready = true;
      this.messageID = info.messageID;
      this.timestamp = info.timestamp;
      this.threadID = info.threadID;
      this.resolveInternal(this);
    }

    public async listenReplies({ timeout }: { timeout: number }) {
      await this;
      this.onListenReply({ timeout });
      if (isFinite(timeout)) {
        return setTimeout(() => {
          this.stopListenReplies();
        }, timeout);
      }
      return null;
    }

    public async stopListenReplies() {
      await this;
      this.onUnlistenReply();
    }

    public async listenReactions({ timeout }: { timeout: number }) {
      await this;
      this.onListenReactions({ timeout });
      if (isFinite(timeout)) {
        return setTimeout(() => {
          this.stopListenReactions();
        }, timeout);
      }
      return null;
    }

    public async stopListenReactions() {
      await this;
      this.onUnlistenReations();
    }
  }

  export interface DispatchedInfo {
    messageID: string;
    timestamp: number;
    threadID: string;
  }

  export function normalizeForm(form: DispatchForm): DispatchFormStrict {
    if (typeof form === "string" || form instanceof ZeyahElement) {
      return { body: form };
    }
    return { ...form };
  }
}
