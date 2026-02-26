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

import { createElement, ZeyahElement } from "@kayelaa/zeyah";
import { ZeyahAdapter } from "@zeyah-bot/adapters/base";
import { ZeyahIO } from "@zeyah-bot/domain/io";
import { AdapterRegistry } from "@zeyah-bot/registry";
import {
  ZeyahInferredEvent,
  ZeyahMessageEvent,
  ZeyahMessageOrReply,
} from "@zeyah-bot/types";
import { ReadStream } from "node:fs";
import {
  API,
  ListenEvent,
  login,
  LoginCredentials,
  LoginOptions,
  MessageObject,
} from "ws3-fca";
export class Ws3FBAdapter extends ZeyahAdapter {
  repliesMap: Map<string, Ws3FBDispatched>;
  constructor(api: API) {
    super();
    this.platformType = "facebook";
    this.internalAPI = api;

    this.repliesMap = new Map<string, Ws3FBDispatched>();
    this.on("event", (e) => {
      this.handleReplies(e);
    });
  }

  handleReplies(e: ZeyahInferredEvent) {
    if (e.type === "message_reply") {
      const dispatched = this.repliesMap.get(e.messageID);
      if (dispatched) {
        dispatched.emit("reply", new ZeyahIO(e, this), e);
      }
    }
  }

  declare internalAPI: API;

  static async fromLogin(
    credentials: LoginCredentials,
    options: LoginOptions,
  ): Promise<Ws3FBAdapter> {
    return new Promise<Ws3FBAdapter>((res, rej) => {
      login(credentials, options, (err, api) => {
        if (err) {
          return rej(err);
        }
        const inst = new Ws3FBAdapter(api);
        res(inst);
        return;
      });
    });
  }

  onStartListen(): void {
    (this.internalAPI.listenMqtt as API["listen"])((err, event) => {
      if (err) {
        console.error(err);
        return;
      }
      if (event.type === "message") {
        this.triggerEvent({
          body: event.body,
          mentions: Object.fromEntries(Object.entries(event.mentions)),
          messageID: event.messageID,
          messageReply: event.messageReply
            ? {
                body: event.messageReply.body,
                messageID: event.messageReply.messageID,
                mentions: null,
                senderID: event.messageReply.senderID,
                threadID: null,
                type: "message",
                extras: new Map(),
              }
            : null,
          threadID: event.threadID,
          senderID: event.senderID,
          type: event.messageReply ? "message_reply" : "message",
          extras: new Map(),
        } satisfies ZeyahMessageOrReply);
      }
    });
  }
  onStopListen(): void {
    throw new Error("I cant stop sorry.");
  }

  onDispatch(
    facadeIO: ZeyahIO<ZeyahInferredEvent>,
    event: ZeyahInferredEvent,
    form: ZeyahAdapter.DispatchFormStrict,
  ): Ws3FBDispatched {
    try {
      const dispatched = new Ws3FBDispatched(this);
      let memoryForm: ZeyahAdapter.DispatchFormStrict = {};

      // (Auto-infer params)
      dispatched["setFormProperty"] = (k, v) => {
        if (dispatched.isReady()) {
          throw new Error("Cannot modify form after dispatch started");
        }
        memoryForm[k] = v;
        return dispatched;
      };

      process.nextTick(async () => {
        let normalBody =
          form.body instanceof ZeyahElement
            ? (typeof facadeIO.WrapperFC === "function"
                ? createElement(
                    facadeIO.WrapperFC,
                    {
                      children: form.body,
                    },
                    "",
                  )
                : form.body
              ).renderFacebook()
            : form.body;
        const validForm: MessageObject = {
          body: normalBody,
          attachment: (Array.isArray(form.attachments)
            ? form.attachments
            : [form.attachments]
          )
            .map((i) => i.stream)
            .filter(Boolean) as ReadStream[],
        };
        (this.internalAPI.sendMessage as API["sendMessageMqtt"])(
          validForm,
          form.thread,
          form.replyTo,
          (err, info) => {
            return dispatched.__resolveResponse(
              {
                messageID: info.messageID,
                threadID: info.threadID,
                timestamp: new Date(info.timestamp).getTime(),
              },
              err,
            );
          },
        );
      });
      return dispatched;
    } catch (error) {
      throw error;
    }
  }
  async onUnsend(
    facadeIO: ZeyahIO<ZeyahInferredEvent>,
    event: ZeyahInferredEvent,
    messageID: ZeyahMessageEvent["messageID"],
    threadID: ZeyahMessageEvent["threadID"],
  ): Promise<void> {
    try {
      await this.internalAPI.unsent(messageID, threadID);
    } catch (error) {
      throw error;
    }
  }

  async onResolveUsername(identifier: string): Promise<string> {
    const userInfo = await this.internalAPI.getUserInfo(identifier);
    const n = userInfo?.name;
    if (!n) {
      throw new Error("Cannot fetch user's name");
    }
    return n;
  }
}

export class Ws3FBDispatched extends ZeyahAdapter.ZeyahDispatched {
  declare adapter: Ws3FBAdapter;
  constructor(adapter: Ws3FBAdapter) {
    super(adapter);
  }

  protected onListenReply(): void {
    this.adapter.repliesMap.set(this.messageID, this);
  }
  protected onUnlistenReply(): void {
    this.adapter.repliesMap.delete(this.messageID);
  }
  protected onListenReactions({ timeout }: { timeout: number }): void {
    throw new Error("Method not implemented.");
  }
  protected onUnlistenReations(): void {
    throw new Error("Method not implemented.");
  }
  protected onReady(): void {}
}

AdapterRegistry.Facebook = Ws3FBAdapter;
