import {
  Client,
  IntentsBitField,
  Message,
  MessageReaction,
  PartialUser,
  User,
  TextChannel,
  PartialMessageReaction,
  EmbedBuilder,
  MessageCollector,
  AttachmentBuilder,
  DMChannel,
  NonThreadGuildBasedChannel,
  GuildChannel,
  CategoryChannel,
  AnyThreadChannel,
  TextThreadChannel,
  ForumThreadChannel,
  PrivateThreadChannel,
  PublicThreadChannel,
  Collection,
  ThreadMember,
  GuildMember,
  VoiceState,
  ReadonlyCollection,
  PartialThreadMember,
  PartialGuildMember,
} from "discord.js";
import { ZeyahAdapter } from "@zeyah-bot/adapters/base";
import { ZeyahIO } from "@zeyah-bot/domain/io";
import {
  ZeyahInferredEvent,
  ZeyahLogEvent,
  ZeyahLogEventData,
  ZeyahLogEventType,
  ZeyahMessageEvent,
  ZeyahMessageOrReply,
  ZeyahMessageReaction,
  ZeyahMessageReplyEvent,
} from "@zeyah-bot/types";
import { createZeyahTree, ZeyahElement, ZeyahFiber } from "@kayelaa/zeyah";
import { DiscordStateKey } from "@zeyah-bot/components";
import { AdapterRegistry } from "@zeyah-bot/registry";
import { formatList } from "@zeyah-utils";

export class DiscordDispatched extends ZeyahAdapter.ZeyahDispatched {
  private botMessage?: Message;
  replyCollector: MessageCollector;
  io: ZeyahIO<ZeyahInferredEvent>;

  constructor(
    io: ZeyahIO<ZeyahInferredEvent>,
    adapter: ZeyahAdapter,
    botMessage?: Message,
  ) {
    super(adapter);
    this.io = io;
    this.botMessage = botMessage;
  }

  protected onListenReply({ timeout }: { timeout: number }) {
    if (!this.botMessage) return;

    const channel = this.botMessage.channel as TextChannel;

    this.replyCollector = channel.createMessageCollector({
      time: timeout,
      filter: (msg: Message) =>
        msg.reference?.messageId === this.botMessage!.id,
    });

    this.replyCollector.on("collect", (msg) => {
      this.emitReply(msg);
    });
  }

  protected async emitReply(msg: Message) {
    if (!msg.reference?.messageId) return;

    const channel = msg.channel as TextChannel;

    let replied: Message | null = null;

    try {
      replied = await channel.messages.fetch(msg.reference.messageId);
    } catch {
      replied = null;
    }

    if (!replied) return;

    const replyEvent: ZeyahMessageReplyEvent = {
      type: "message_reply",
      messageID: msg.id,
      threadID: msg.channelId,
      senderID: msg.author.id,
      body: msg.content,
      mentions: Object.fromEntries(
        Array.from(msg.mentions.users.values()).map((user) => [
          user.id,
          `@${user.username}`,
        ]),
      ),

      messageReply: {
        type: "message",
        messageID: replied.id,
        threadID: replied.channelId,
        senderID: replied.author.id,
        body: replied.content,
        mentions: Object.fromEntries(
          Array.from(replied.mentions.users.values()).map((user) => [
            user.id,
            `@${user.username}`,
          ]),
        ),
        extras: new Map([["channel", replied.channel]]),
      },

      extras: new Map([["channel", msg.channel]]),
    };

    this.emit("reply", this.io as ZeyahIO<ZeyahMessageReplyEvent>, replyEvent);
  }

  protected onUnlistenReply() {
    this.replyCollector?.stop();
    this.replyCollector = undefined;
  }

  protected onListenReactions({ timeout }: { timeout: number }): void {
    throw new Error("Method not implemented.");
  }
  protected onUnlistenReations(): void {
    throw new Error("Method not implemented.");
  }

  protected onReady() {}
}

// --- Adapter class ---
export class DiscordAdapter extends ZeyahAdapter {
  declare public internalAPI: Client;
  private token: string;
  replyMessageIds = new Set<string>();

  constructor(token: string) {
    super();
    this.platformType = "discord";
    this.token = token;
    this.internalAPI = new Client({
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMessageReactions,
      ],
    });
  }

  onStartListen(): void {
    this.internalAPI.login(this.token).then(() => {
      this.internalAPI.on("messageCreate", (msg) => this.handleMessage(msg));
      this.internalAPI.on("messageReactionAdd", (reaction, user) =>
        this.handleReaction(reaction, user),
      );
      console.log("DiscordAdapter: listening", this.internalAPI.user.username);
    });
    this.internalAPI.on("guildCreate", (guild) => {
      console.log("Joined a server!");
      console.log("Server name:", guild.name);
      console.log("Server ID:", guild.id);
    });
    this.internalAPI.on("threadUpdate", (oldCh, newCh) =>
      this.handleThreadUpdate(oldCh, newCh),
    );

    this.internalAPI.on("threadMembersUpdate", (added, removed, thread) =>
      this.handleThreadMembersUpdate(added, removed, thread),
    );

    this.internalAPI.on("guildMemberUpdate", (oldMember, newMember) =>
      this.handleGuildMemberUpdate(oldMember, newMember),
    );

    this.internalAPI.on("voiceStateUpdate", (oldState, newState) =>
      this.handleVoiceStateUpdate(oldState, newState),
    );
  }

  onStopListen(): void {
    this.internalAPI.destroy();
  }

  onDispatch(
    _facadeIO: ZeyahIO<ZeyahInferredEvent>,
    event: ZeyahInferredEvent,
    { ...form }: ZeyahAdapter.DispatchFormStrict,
  ): ZeyahAdapter.ZeyahDispatched {
    const dispatched = new DiscordDispatched(_facadeIO, this);
    let memoryForm: ZeyahAdapter.DispatchFormStrict = {};

    // (Auto-infer params)
    dispatched["setFormProperty"] = (k, v) => {
      if (dispatched.isReady()) {
        throw new Error("Cannot modify form after dispatch started");
      }
      memoryForm[k] = v;
      return dispatched;
    };
    let self = this;
    async function dispatch() {
      Object.assign(form, memoryForm);
      if (!("body" in form) && !form.attachments)
        throw new Error("Nothing to send");
      if (!form.thread) {
        throw new Error("Invaliid thread/channelID");
      }

      const channel = await self.internalAPI.channels.fetch(form.thread);
      if (!channel.isTextBased())
        throw new Error("Cant send to non text based.");

      let embeds: EmbedBuilder[] = [];
      let tree: ZeyahFiber<any> = null;
      let content = typeof form.body === "string" ? form.body : null;
      if (form.body instanceof ZeyahElement) {
        tree = createZeyahTree(form.body);
        content = tree.render("discord").join("");
        const embedsPossible = (tree.states.get(DiscordStateKey) ??
          []) as EmbedBuilder[];
        embeds = embedsPossible;
      }

      async function async_() {
        let replyToRef: Message;
        if (!channel.isTextBased())
          throw new Error("Cant send to non text based.");
        if (!("send" in channel))
          throw new Error("Cant send to non text based.");

        if (typeof form.replyTo === "string") {
          try {
            replyToRef = await channel.messages.fetch(form.replyTo);
          } catch {
            replyToRef = null;
          }
        }
        const attachments = (form.attachments ?? []).map((i) => {
          return new AttachmentBuilder(i.stream as any, { name: i.name });
        });
        const promise = channel.send({
          content: content || undefined,
          files: attachments,
          embeds: embeds.filter(Boolean),
          reply: replyToRef ? { messageReference: replyToRef } : undefined,
        });
        try {
          const msg = await promise;
          dispatched["botMessage"] = msg;
          dispatched.__resolveResponse({
            messageID: msg.id,
            threadID: msg.channelId,
            timestamp: msg.createdTimestamp,
          });
        } catch (err) {
          dispatched.__resolveResponse(null, err);
        }
      }
      await async_();
    }
    process.nextTick(() => {
      dispatch();
    });

    return dispatched;
  }

  async onUnsend(
    _facadeIO: ZeyahIO<ZeyahInferredEvent>,
    event: ZeyahInferredEvent,
    messageID: string,
    _threadID: string,
  ) {
    const channel = await this.internalAPI.channels.fetch(_threadID);
    if (!channel.isTextBased()) throw new Error("Not text based.");
    const msg = await channel.messages.fetch(messageID);
    if (msg) await msg.delete();
  }

  private async handleMessage(msg: Message) {
    if (msg.author.id === this.internalAPI.user.id) return;
    let replied: Message | null = null;

    try {
      replied = await msg.channel.messages.fetch(msg.reference.messageId);
    } catch {
      replied = null;
    }
    const ev: ZeyahMessageOrReply = {
      type: replied ? "message_reply" : "message",
      messageID: msg.id,
      threadID: msg.channelId,
      senderID: msg.author.id,
      body: msg.content,
      mentions: Object.fromEntries(
        Array.from(msg.mentions.users.values()).map((user) => [
          user.id,
          `@${user.username}`,
        ]),
      ),
      extras: new Map<any, any>([
        ["channel", msg.channel],
        ["replyTo", msg.reference?.messageId],
      ]),
      messageReply: replied
        ? ({
            type: "message",
            messageID: replied.id,
            threadID: replied.channelId,
            senderID: replied.author.id,
            body: replied.content,
            mentions: Object.fromEntries(
              Array.from(replied.mentions.users.values()).map((user) => [
                user.id,
                `@${user.username}`,
              ]),
            ),
            extras: new Map([["channel", replied.channel]]),
          } satisfies ZeyahMessageEvent)
        : null,
    };
    this.triggerEvent(ev);
  }

  private handleReaction(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
  ) {
    const ev: ZeyahMessageReaction = {
      type: "message_reaction",
      messageID: reaction.message.id,
      userID: user.id,
      reaction: reaction.emoji.name,
      senderID: reaction.message.author.id,
      extras: new Map(),
    };
    this.triggerEvent(ev);
  }

  async onResolveUsername(identifier: string): Promise<string> {
    try {
      const user = await this.internalAPI.users.fetch(identifier);
      return user.username;
    } catch (error) {
      throw new Error("Cannot fetch user's name");
    }
  }

  private handleThreadUpdate(
    oldChannel: AnyThreadChannel,
    newChannel: AnyThreadChannel,
  ) {
    if (oldChannel.name !== newChannel.name) {
      const nname = newChannel.name ?? null;
      this.normalizeLogEvent(
        "log:thread-name",
        `Someone changed the group name to ${nname}.`,
        {
          name: nname,
        },
        "-1",
        new Map([["channel", newChannel]]),
      );
    }
  }

  private handleGuildMemberUpdate(
    oldMember: GuildMember | PartialGuildMember,
    newMember: GuildMember,
  ) {
    if (oldMember.nickname !== newMember.nickname) {
      const nickname = newMember.nickname ?? "";
      const name = newMember.user.username;
      this.normalizeLogEvent(
        "log:user-nickname",
        `${name} set their own nickname to ${nickname}.`,
        {
          participant_id: newMember.id,
          nickname: nickname,
        },
        newMember.id,
        new Map(),
      );
    }
  }

  private handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
    const joined = !oldState.channelId && newState.channelId;
    const left = oldState.channelId && !newState.channelId;

    if (joined) {
      this.normalizeLogEvent(
        "log:thread-call",
        "Call started",
        {
          caller_id: newState.id,
          call_duration: 0,
          event: "group_call_started",
        },
        newState.id,
        new Map(),
      );
    }

    if (left) {
      this.normalizeLogEvent(
        "log:thread-call",
        "Call ended",
        {
          caller_id: oldState.id,
          call_duration: 0,
          event: "group_call_ended",
        },
        oldState.id,
        new Map(),
      );
    }
  }

  private handleThreadMembersUpdate(
    addedMembers: ReadonlyCollection<string, ThreadMember>,
    removedMembers: ReadonlyCollection<
      string,
      ThreadMember | PartialThreadMember
    >,
    thread: AnyThreadChannel,
  ) {
    const extras = new Map<string, unknown>([["channel", thread]]);

    if (addedMembers.size > 0) {
      const addedParticipants = addedMembers.map((m) => ({
        userFbId: m.user?.id,
        fullName: m.user?.username ?? "unknown",
      }));

      this.normalizeLogEvent(
        "log:subscribe",
        `${formatList(addedParticipants.map((i) => i.fullName))} joined the group.`,
        { addedParticipants },
        undefined,
        extras,
      );
    }

    if (removedMembers.size > 0) {
      for (const member of removedMembers.values()) {
        this.normalizeLogEvent(
          "log:unsubscribe",
          `${member.user.username} left the group.`,
          { leftParticipantFbId: member.user.id },
          undefined,
          extras,
        );
      }
    }
  }

  protected normalizeLogEvent<K extends ZeyahLogEventType>(
    type: K,
    body: string,
    data: ZeyahLogEventData[K],
    author?: string,
    extras?: Map<string, unknown>,
  ) {
    const event: ZeyahLogEvent<K> = {
      type: "event",
      logMessageType: type,
      logMessageBody: body,
      logMessageData: data,
      author,
      extras: extras ?? new Map(),
    };

    this.triggerEvent(event);
  }
}
AdapterRegistry.Discord = DiscordAdapter;
