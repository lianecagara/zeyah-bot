import Zeyah, { Bold, PropsWithInfo } from "@kayelaa/zeyah";
import { JoinNode } from "@zeyah-bot/components";
import { Interact } from "@zeyah-bot/types";

export namespace Menu {
  /**
   * A subcommand option function signature
   */
  export interface Option {
    (ctx: Interact.Ctx, extra: ExtraData): Promise<void>;
  }
  /**
   * A subcommand metadata for listing it.
   */
  export interface Meta {
    args?: (`<${string}>` | `[${string}]`)[];
    description?: string;
    emoji?: string;
    aliases?: string[];
  }

  /**
   * Extra manipulation context.
   */
  export interface ExtraData {
    /**
     * Returns the current subcommand.
     */
    subcommand: string;
    /**
     * Returns a properly sliced arguments (excluding command and subcommand).
     */
    args: string[];
    /**
     * Uses the default behavior when no subcommand provided or wrong subcommand. Useful if you want to quick validate args without custom response.
     */
    showMenu(): Promise<void>;

    /**
     * Reference instance.
     */
    menu: Menu;
  }

  export type OptionMap = Map<string, Option>;
  export type MetaMap = Map<string, Meta>;

  export interface OptionInterface extends Meta {
    subcommand: string;
    handler: Menu.Option;
  }
}

export type IteratedToArray<T> = T extends Iterable<infer U> ? U[] : never;

export class Menu implements Interact.Contextual {
  /**
   * All option callbacks/handlers for a subcommand
   */
  #options: Menu.OptionMap;

  /**
   * All option metadata for a subcommand.
   */
  #meta: Menu.MetaMap;

  *[Symbol.iterator]() {
    yield* this.#options;
  }

  /**
   * Creates a quicker instance with existing options.
   * @param options Existing handler data (excluding meta)
   */
  constructor(options?: IteratedToArray<Menu>);

  /**
   * A clean constructor with no existing data.
   */
  constructor();

  constructor(options?: IteratedToArray<Menu>) {
    this.#options = new Map();
    this.#meta = new Map();
    this.ShowMenuComponent = ({ childrenString }) => {
      return childrenString;
    };

    if (Array.isArray(options)) {
      for (const [key, value] of options) {
        this.option(key, value);
      }
    }
  }

  ShowMenuComponent: Zeyah.FC<PropsWithInfo>;

  /**
   * Not recommended to be used directly. Please refer to Ctx.runContextual(Contextual);
   * @private
   */
  async runInContext(ctx: Interact.Ctx): Promise<void> {
    try {
      const {
        zeyahIO,
        currentPrefix: currentPrefix,
        commandBase,
        args: argTokens,
      } = ctx;
      const [subcommand, ...menuArgs] = argTokens;

      const menu = this;
      const showMenu = async () => {
        const e = [...menu.#meta.entries()];
        let hasSomeEmoji = e.some((i) => i[1]?.emoji);
        const { ShowMenuComponent } = this;
        await zeyahIO.reply(
          <ShowMenuComponent>
            {e.map(([subcommand, meta]) => {
              return (
                <>
                  {hasSomeEmoji ? `${meta.emoji ?? "✨"} ` : ""}
                  {currentPrefix}
                  {commandBase} <Bold>{subcommand}</Bold>
                  {meta.description ? ` - ${meta.description}` : ""}
                  <br />
                </>
              );
            })}
          </ShowMenuComponent>,
        );
      };
      const extra: Menu.ExtraData = {
        subcommand,
        args: menuArgs,
        showMenu,
        menu: this,
      };
      const found = this.option(subcommand);
      if (!subcommand || !found) {
        await extra.showMenu();
        return;
      }
      await found(ctx, extra);
    } catch (error) {
      // await ctx.zeyahIO.error(error);
      console.error(error);
    }
  }

  /**
   * Resolves meta and option callback using an alias
   */
  protected resolveAliased(alias: string): {
    option: Menu.Option;
    meta: Menu.Meta;
  } | null {
    const directOption = this.#options.get(alias);
    if (directOption) {
      const meta = this.#meta.get(alias) ?? {};
      return { option: directOption, meta };
    }

    for (const [subcommand, meta] of this.#meta.entries()) {
      if (meta.aliases?.includes(alias)) {
        const option = this.#options.get(subcommand);
        if (option) {
          return { option, meta };
        }
      }
    }

    return null;
  }

  /**
   * Resolves the option callback using an alias
   */
  protected resolveAliasedOpt(alias: string): Menu.Option | null {
    const directOption = this.#options.get(alias);
    if (directOption) return directOption;

    for (const [subcommand, meta] of this.#meta.entries()) {
      if (meta.aliases?.includes(alias)) {
        return this.#options.get(subcommand) ?? null;
      }
    }

    return null;
  }

  /**
   * Resolves meta using an alias
   */
  protected resolveAliasedMeta(alias: string): Menu.Meta | null {
    const directMeta = this.#meta.get(alias);
    if (directMeta) return directMeta;

    for (const [, meta] of this.#meta.entries()) {
      if (meta.aliases?.includes(alias)) {
        return meta;
      }
    }

    return null;
  }

  /**
   * Set an option using an object with { subcommand, handler() }
   * @param config the object with the subcommand and handler.
   */
  option(config: Menu.OptionInterface): Menu;

  /**
   * Set an option using a subcommand.
   * @param subcommand the subcommand
   * @param callback the handler for the subcommand.
   */
  option(subcommand: string, callback: Menu.Option): Menu;

  /**
   * Resolves an option using a subcommand.
   * @param subcommand the subcommand
   */
  option(subcommand: string): Menu.Option;

  /**
   * Resolves the unmutable option map (each option entry is still mutable)
   */
  option(): Menu.OptionMap;

  option(
    ...args: [(string | Menu.OptionInterface)?, Menu.Option?]
  ): Menu | Menu.OptionMap | Menu.Option {
    if (args.length === 0 || !args[0]) {
      return new Map(this.#options);
    }
    if (args.length === 1) {
      if (typeof args[0] === "string") {
        return this.resolveAliasedOpt(args[0]);
      } else if (args[0] && typeof args[0] === "object") {
        const ref = { ...args[0] };
        const sub = ref.subcommand;
        this.#options.set(sub, ref.handler);
        delete ref.subcommand;
        delete ref.handler;
        this.#meta.set(sub, ref);

        return this;
      }
    } else {
      const [subcommand, callback] = args;
      this.#options.set(subcommand as string, callback);
      return this;
    }
  }

  /**
   * Sets an important but optional metadata for an option.
   * @param subcommand the subcommand.
   * @param meta the object metadata contaning emoji, desc, etc.
   */
  meta(subcommand: string, meta: Menu.Meta): Menu;

  /**
   * Resolves a mutable metadata object (only if it exists.)
   * @param subcommand the subcommand.
   */
  meta(subcommand: string): Menu.Meta;

  /**
   * Resolves an unmutable map of metadata (but each metadata entry is mutable)
   */
  meta(): Menu.MetaMap;

  meta(...args: [string?, Menu.Meta?]): Menu | Menu.MetaMap | Menu.Meta {
    if (args.length === 0 || !args[0]) {
      return new Map(this.#meta);
    }
    if (args.length === 1) {
      return this.resolveAliasedMeta(args[0]);
    }
    const [subcommand, metadata] = args;
    this.#meta.set(subcommand, metadata);
    return this;
  }

  /**
   * Modifies the metadata description.
   */
  description(subcommand: string, desc: Menu.Meta["description"]): Menu;

  /**
   * Resolves the metadata description.
   */
  description(subcommand: string): Menu.Meta["description"];

  description(
    subcommand: string,
    desc?: Menu.Meta["description"],
  ): Menu.Meta["description"] | Menu {
    if (typeof desc === "string") {
      const meta = this.resolveAliasedMeta(subcommand) ?? {};
      meta.description = desc;
      this.#meta.set(subcommand, meta);
      return this;
    }
    const meta = this.resolveAliasedMeta(subcommand) ?? {};
    return meta.description ?? null;
  }

  /**
   * Modifies the metadata emoji.
   */
  emoji(subcommand: string, emoji: Menu.Meta["emoji"]): Menu;

  /**
   * Resolves the metadata emoji.
   */
  emoji(subcommand: string): Menu.Meta["emoji"];

  emoji(
    subcommand: string,
    emoji?: Menu.Meta["emoji"],
  ): Menu.Meta["emoji"] | Menu {
    if (typeof emoji === "string") {
      const meta = this.resolveAliasedMeta(subcommand) ?? {};
      meta.emoji = emoji;
      this.#meta.set(subcommand, meta);
      return this;
    }
    const meta = this.resolveAliasedMeta(subcommand) ?? {};
    return meta.emoji ?? null;
  }

  /**
   * Modifies the metadata args.
   */
  args(subcommand: string, args: Menu.Meta["args"]): Menu;

  /**
   * Resolves the metadata args.
   */
  args(subcommand: string): Menu.Meta["args"];

  args(subcommand: string, args?: Menu.Meta["args"]): Menu.Meta["args"] | Menu {
    if (Array.isArray(args)) {
      const meta = this.resolveAliasedMeta(subcommand) ?? {};
      meta.args = args;
      this.#meta.set(subcommand, meta);
      return this;
    }
    const meta = this.resolveAliasedMeta(subcommand) ?? {};
    return meta.args ?? null;
  }
  /**
   * Modifies the metadata aliases.
   */
  aliases(subcommand: string, aliases: Menu.Meta["aliases"]): Menu;

  /**
   * Resolves the metadata aliases.
   */
  aliases(subcommand: string): Menu.Meta["aliases"];

  aliases(
    subcommand: string,
    aliases?: Menu.Meta["aliases"],
  ): Menu.Meta["aliases"] | Menu {
    if (Array.isArray(aliases)) {
      const meta = this.resolveAliasedMeta(subcommand) ?? {};
      meta.aliases = aliases;
      this.#meta.set(subcommand, meta);
      return this;
    }
    const meta = this.resolveAliasedMeta(subcommand) ?? {};
    return meta.aliases ?? null;
  }
}
