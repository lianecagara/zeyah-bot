import Zeyah, {
  Bold,
  Break,
  CassFormat,
  Code,
  Italic,
  Platform,
  PropsWithInfo,
  Repeated,
  Text,
  UniFont,
  ZeyahChildren,
  ZeyahFiber,
} from "@kayelaa/zeyah";
import {
  abbreviateNumber,
  FontTypes,
  formatCash,
  UNIRedux,
} from "@nea-liane/styler";
import {
  abbreviateNumberDecimal,
  addCommas,
  clamp01,
  random56Bit,
  randomArrayValue,
  randomChoiceWeighted,
  shuffle,
} from "@zeyah-utils";

/**
 * **RandomProps** defines the properties for the **Random** component.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export interface RandomProps {
  /**
   * The **t** value used for random selection (0-1).
   */
  t?: number;
}

/**
 * **StrictZeyahChildren** is a type that ensures children have a specific fiber type.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export type StrictZeyahChildren<T> = Omit<ZeyahChildren, "fiber"> & {
  fiber: ZeyahFiber<T>;
};

/**
 * **Random** is a component from **@zeyah-bot/components** that randomly renders one of its **Choice** children.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const Random: Zeyah.FC<PropsWithInfo<RandomProps>> = ({
  t = random56Bit(),
  childrenData,
}) => {
  t = clamp01(t);

  const candidates = childrenData.filter(
    (i) =>
      i.fiber !== "string" && i.fiber.type.displayName === Choice.displayName,
  ) as StrictZeyahChildren<ChoiceProps>[];
  const mapped = candidates.map((i) => {
    return {
      fiber: i.fiber,
      rendered: i.rendered,
      weight: i.fiber.props.weight ?? 1,
    };
  });
  const result = randomChoiceWeighted(
    mapped.map((i) => ({ item: i, weight: i.weight })),
  );
  return result.rendered;
};
Random.displayName = "Random";

/**
 * **ChoiceProps** defines the properties for the **Choice** component.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export interface ChoiceProps {
  /**
   * The **weight** of this choice when used inside a **Random** component.
   */
  weight?: number;
}

/**
 * **Choice** is a component from **@zeyah-bot/components** used to define a selectable option within a **Random** or **Shuffle** component.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const Choice: Zeyah.FC<PropsWithInfo<ChoiceProps>> = ({
  childrenString,
}) => {
  return childrenString;
};

Choice.displayName = "Choice";

/**
 * **Shuffle** is a component from **@zeyah-bot/components** that renders its **Choice** children in a random order.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const Shuffle: Zeyah.FC<PropsWithInfo> = ({ childrenData }) => {
  const elements = childrenData.filter(
    (i) =>
      i.fiber !== "string" && i.fiber.type.displayName === Choice.displayName,
  );
  const shuffled = shuffle(elements);
  return shuffled.map((i) => i.rendered);
};
Shuffle.displayName = "Shuffle";

/**
 * **Breaks** is a component from **@zeyah-bot/components** that renders multiple **Break** elements.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const Breaks: Zeyah.FC<PropsWithInfo<{ n: number }>> = ({ n }) => {
  return (
    <Repeated times={n}>
      <Break />
    </Repeated>
  );
};

/**
 * **JSONStr** is a component from **@zeyah-bot/components** that renders a JSON-stringified representation of the provided data.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const JSONStr: Zeyah.FC<
  PropsWithInfo<{ data: any; indent?: number }>
> = ({ data, indent = 2 }) => {
  return JSON.stringify(data, null, indent);
};

/**
 * **EmbedTitle** defines the title of an **Embed**.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const EmbedTitle: Zeyah.FC<PropsWithInfo> = ({ childrenString }) =>
  childrenString;
EmbedTitle.displayName = "EmbedTitle";

/**
 * **EmbedDescription** defines the description of an **Embed**.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const EmbedDescription: Zeyah.FC<PropsWithInfo> = ({ childrenString }) =>
  childrenString;
EmbedDescription.displayName = "EmbedDescription";

/**
 * **EmbedFooter** defines the footer of an **Embed**.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const EmbedFooter: Zeyah.FC<PropsWithInfo<{ iconURL?: string }>> = ({
  childrenString,
}) => childrenString;
EmbedFooter.displayName = "EmbedFooter";

import { EmbedBuilder } from "discord.js";
import {
  LanguageType,
  LanguageTypeWithFallback,
  SemVerLiteral,
  ZeyahMessageOrReply,
} from "@zeyah-bot/types";
import Decimal from "decimal.js";
import { getConfig } from "@zeyah-bot/registry";

export const DiscordStateKey = "discordEmbeds";

/**
 * **Embed** is a component from **@zeyah-bot/components** that renders a rich embed (Discord) or formatted text (Facebook).
 *
 * It uses **EmbedTitle**, **EmbedDescription**, and **EmbedFooter** as children.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const Embed: Zeyah.FC<PropsWithInfo> = ({
  childrenData,
  rootFiber,
  platform,
}) => {
  if (platform === "discord") {
    const embed = new EmbedBuilder();

    for (const child of childrenData) {
      if (child.fiber === "string") continue;
      const type = child.fiber?.type?.displayName;
      const rendered = child.rendered as string;

      switch (type) {
        case "EmbedTitle":
          embed.setTitle(rendered);
          break;
        case "EmbedDescription":
          embed.setDescription(rendered);
          break;
        case "EmbedFooter":
          embed.setFooter({ text: rendered });
          break;
      }
    }

    rootFiber.states.set(
      DiscordStateKey,
      rootFiber.states.get(DiscordStateKey) ?? [],
    );
    const arr = rootFiber.states.get(DiscordStateKey) as EmbedBuilder[];
    arr.push(embed);
    rootFiber.states.set(DiscordStateKey, arr);
    const element = <></>;

    return element;
  } else if (platform === "facebook") {
    let title: string = "??";
    let content: string = "??";
    let footer: string = "";
    for (const child of childrenData) {
      if (child.fiber === "string") continue;
      const type = child.fiber?.type?.displayName;
      const rendered = child.rendered as string;

      switch (type) {
        case "EmbedTitle":
          title = rendered;
          break;
        case "EmbedDescription":
          content = rendered;
          break;
        case "EmbedFooter":
          footer = rendered;
          break;
      }
    }
    return (
      <>
        <CassFormat {...{ title }}>{content}</CassFormat>
        {footer ? (
          <>
            <br />
            <Italic>{footer}</Italic>
          </>
        ) : null}
      </>
    );
  }
};

Embed.displayName = "DiscordEmbed";

/**
 * **Conditional** is a component from **@zeyah-bot/components** that renders its children only if the **if** condition is met.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const Conditional: Zeyah.FC<PropsWithInfo<{ if(): boolean }>> = ({
  if: if_,
  getChildrenString,
}) => {
  if (if_()) {
    return getChildrenString();
  }
  return null;
};

Conditional.displayName = "Conditional";

/**
 * **DiscordMention** is a component from **@zeyah-bot/components** that renders a Discord mention for the event sender.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const DiscordMention: Zeyah.FC<
  PropsWithInfo<{
    event: ZeyahMessageOrReply;
  }>
> = ({ event }) => {
  return `<@${event.senderID}>`;
};
/**
 * **Points** is a component from **@zeyah-bot/components** that formats and renders a point value with an emoji and "Pts." suffix.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const Points: Zeyah.FC<PropsWithInfo<{ n: number | Decimal }>> = ({
  n,
}) => {
  const cashNumber = n instanceof Decimal ? n : Decimal(n || NaN);
  const limit = Decimal(1e9);
  return (
    <>
      🎯{" "}
      <Conditional if={() => cashNumber.lte(limit)}>
        <Bold>{addCommas(cashNumber)}</Bold>
      </Conditional>{" "}
      <Conditional if={() => cashNumber.gt(limit)}>
        <Bold>{cashNumber.toExponential(3)}</Bold>
      </Conditional>{" "}
      <Conditional if={() => cashNumber.gte(1000)}>
        <Bold>({abbreviateNumberDecimal(cashNumber)})</Bold>{" "}
      </Conditional>
      <Bold>Pts.</Bold>
    </>
  );
};

/**
 * **DecimalNode** is a component from **@zeyah-bot/components** that formats and renders a **Decimal** value with commas and abbreviations.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const DecimalNode: Zeyah.FC<PropsWithInfo<{ n: number | Decimal }>> = ({
  n,
}) => {
  const cashNumber = n instanceof Decimal ? n : Decimal(n || NaN);
  const limit = Decimal(1e9);
  return (
    <>
      <Conditional if={() => cashNumber.lte(limit)}>
        <Bold>{addCommas(cashNumber)}</Bold>
      </Conditional>{" "}
      <Conditional if={() => cashNumber.gt(limit)}>
        <Bold>{cashNumber.toExponential(3)}</Bold>
      </Conditional>{" "}
      <Conditional if={() => cashNumber.gte(1000)}>
        <Bold>({abbreviateNumberDecimal(cashNumber)})</Bold>
      </Conditional>
    </>
  );
};

/**
 * **ResIDontKnow** is a component from **@zeyah-bot/components** that renders a random "I don't know" response.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const ResIDontKnow: Zeyah.FC = () => {
  return (
    <Random>
      <Choice>I don't know.</Choice>
      <Choice>No clue.</Choice>
      <Choice>Beats me.</Choice>
      <Choice>Honestly? No idea.</Choice>
      <Choice>I'm not sure.</Choice>
      <Choice>Your guess is as good as mine.</Choice>
      <Choice>Search me.</Choice>
      <Choice>I have zero idea.</Choice>
      <Choice>Couldn't tell you.</Choice>
      <Choice>That's beyond me.</Choice>
      <Choice>I'm drawing a blank.</Choice>
      <Choice>No freaking clue.</Choice>
      <Choice>I haven't the slightest.</Choice>
      <Choice>That's a mystery to me.</Choice>
      <Choice>I wish I knew.</Choice>
      <Choice>I got nothing.</Choice>
      <Choice>Ask someone smarter.</Choice>
      <Choice>Not a clue in sight.</Choice>
      <Choice>I'm stumped.</Choice>
      <Choice>Good question.</Choice>
      <Choice>I genuinely don't know.</Choice>
      <Choice>That's above my pay grade.</Choice>
      <Choice>I'm blanking hard.</Choice>
      <Choice>No idea whatsoever.</Choice>
      <Choice>I've got no answer for that.</Choice>
      <Choice>That one's a mystery.</Choice>
      <Choice>Can't help you there.</Choice>
      <Choice>I have absolutely no idea.</Choice>
      <Choice>I'm not the oracle.</Choice>
      <Choice>¯\_(ツ)_/¯</Choice>
    </Random>
  );
};

ResIDontKnow.displayName = "IDontKnow";

/**
 * **ResFailed** is a component from **@zeyah-bot/components** that renders a random failure response.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const ResFailed: Zeyah.FC = () => {
  return (
    <Random>
      <Choice>Failed.</Choice>
      <Choice>That didn't work.</Choice>
      <Choice>Something broke.</Choice>
      <Choice>Operation failed.</Choice>
      <Choice>Nope.</Choice>
      <Choice>Well… that crashed.</Choice>
      <Choice>It blew up.</Choice>
      <Choice>That went sideways.</Choice>
      <Choice>Not happening.</Choice>
      <Choice>Denied.</Choice>
      <Choice>Rejected.</Choice>
      <Choice>That's a miss.</Choice>
      <Choice>Big fail.</Choice>
      <Choice>System said no.</Choice>
      <Choice>That didn't stick.</Choice>
      <Choice>It collapsed.</Choice>
      <Choice>Abort.</Choice>
      <Choice>Invalid.</Choice>
      <Choice>Out of bounds.</Choice>
      <Choice>Try again.</Choice>
      <Choice>Access denied.</Choice>
      <Choice>That's not it.</Choice>
      <Choice>Hard fail.</Choice>
      <Choice>Something went wrong.</Choice>
      <Choice>We hit a wall.</Choice>
      <Choice>It didn't pass.</Choice>
      <Choice>No success.</Choice>
      <Choice>Execution failed.</Choice>
      <Choice>Task unsuccessful.</Choice>
      <Choice>Welp. That failed.</Choice>
    </Random>
  );
};

ResFailed.displayName = "Failed";

/**
 * **ResSuccess** is a component from **@zeyah-bot/components** that renders a random success response.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const ResSuccess: Zeyah.FC = () => {
  return (
    <Random>
      <Choice>Success.</Choice>
      <Choice>It worked.</Choice>
      <Choice>Done.</Choice>
      <Choice>Completed.</Choice>
      <Choice>All good.</Choice>
      <Choice>That worked perfectly.</Choice>
      <Choice>Nice.</Choice>
      <Choice>Success confirmed.</Choice>
      <Choice>We're good.</Choice>
      <Choice>It passed.</Choice>
      <Choice>Green light.</Choice>
      <Choice>Mission complete.</Choice>
      <Choice>Operation successful.</Choice>
      <Choice>That landed.</Choice>
      <Choice>Solid.</Choice>
      <Choice>Naïled it.</Choice>
      <Choice>It stuck.</Choice>
      <Choice>All set.</Choice>
      <Choice>Everything checks out.</Choice>
      <Choice>Clean run.</Choice>
      <Choice>No errors.</Choice>
      <Choice>We're in business.</Choice>
      <Choice>Perfect execution.</Choice>
      <Choice>That did the trick.</Choice>
      <Choice>Success achieved.</Choice>
      <Choice>It went through.</Choice>
      <Choice>All clear.</Choice>
      <Choice>That's a win.</Choice>
      <Choice>Good to go.</Choice>
      <Choice>Flawless.</Choice>
    </Random>
  );
};

ResSuccess.displayName = "Success";

/**
 * **ResWrongInput** is a component from **@zeyah-bot/components** that renders a random "invalid input" response.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const ResWrongInput: Zeyah.FC = () => {
  return (
    <Random>
      <Choice>Invalid input.</Choice>
      <Choice>That's not a valid option.</Choice>
      <Choice>Try again.</Choice>
      <Choice>Wrong input.</Choice>
      <Choice>I can't work with that.</Choice>
      <Choice>That format isn't correct.</Choice>
      <Choice>Nope. That's not it.</Choice>
      <Choice>Input not recognized.</Choice>
      <Choice>That doesn't match any known command.</Choice>
      <Choice>Bad input.</Choice>
      <Choice>Syntax error vibes.</Choice>
      <Choice>You typed something cursed.</Choice>
      <Choice>That's not acceptable input.</Choice>
      <Choice>Invalid parameters.</Choice>
      <Choice>Check your arguments.</Choice>
      <Choice>That doesn't compute.</Choice>
      <Choice>Missing or invalid value.</Choice>
      <Choice>That's outside the allowed range.</Choice>
      <Choice>Unexpected input.</Choice>
      <Choice>Format mismatch.</Choice>
      <Choice>That input is unsupported.</Choice>
      <Choice>Not a valid selection.</Choice>
      <Choice>Try a valid value.</Choice>
      <Choice>That won't work here.</Choice>
      <Choice>Command usage incorrect.</Choice>
      <Choice>Invalid syntax.</Choice>
      <Choice>That's not how this works.</Choice>
      <Choice>Input rejected.</Choice>
      <Choice>That doesn't meet the requirements.</Choice>
      <Choice>Nice try. Still wrong.</Choice>
    </Random>
  );
};

ResWrongInput.displayName = "WrongInput";

/**
 * **ResPermissionDenied** is a component from **@zeyah-bot/components** that renders a random "permission denied" response.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const ResPermissionDenied: Zeyah.FC = () => (
  <Random>
    <Choice>Permission denied.</Choice>
    <Choice>You don't have access to that.</Choice>
    <Choice>Nice try. Not allowed.</Choice>
    <Choice>Insufficient permissions.</Choice>
    <Choice>That action is restricted.</Choice>
    <Choice>Access denied.</Choice>
    <Choice>You're not authorized.</Choice>
    <Choice>This requires higher privileges.</Choice>
  </Random>
);

ResPermissionDenied.displayName = "PermissionDenied";

/**
 * **ResMissingArgs** is a component from **@zeyah-bot/components** that renders a random "missing arguments" response.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const ResMissingArgs: Zeyah.FC = () => (
  <Random>
    <Choice>Missing required arguments.</Choice>
    <Choice>You forgot something.</Choice>
    <Choice>Incomplete command.</Choice>
    <Choice>Required input is missing.</Choice>
    <Choice>Add the missing parameters.</Choice>
    <Choice>Not enough information.</Choice>
    <Choice>This command needs more data.</Choice>
    <Choice>Arguments missing.</Choice>
    <Choice>You skipped a required value.</Choice>
    <Choice>Provide all required inputs.</Choice>
  </Random>
);
ResMissingArgs.displayName = "MissingArgs";

/**
 * **ResNotFound** is a component from **@zeyah-bot/components** that renders a random "not found" response.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const ResNotFound: Zeyah.FC = () => (
  <Random>
    <Choice>Not found.</Choice>
    <Choice>Nothing matched your query.</Choice>
    <Choice>No results.</Choice>
    <Choice>Couldn't find that.</Choice>
    <Choice>That doesn't exist.</Choice>
    <Choice>Search returned empty.</Choice>
    <Choice>No match detected.</Choice>
    <Choice>That record isn't here.</Choice>
    <Choice>No data available.</Choice>
    <Choice>There's nothing here.</Choice>
    <Choice>Result set is empty.</Choice>
    <Choice>No entries found.</Choice>
    <Choice>Query returned nothing.</Choice>
    <Choice>Zero matches.</Choice>
    <Choice>No matching records.</Choice>
    <Choice>That item wasn't located.</Choice>
    <Choice>Nothing by that name.</Choice>
    <Choice>Doesn't appear to exist.</Choice>
    <Choice>We couldn't locate that.</Choice>
    <Choice>No such entry.</Choice>
    <Choice>The lookup came back empty.</Choice>
    <Choice>That ID isn't registered.</Choice>
    <Choice>Invalid reference.</Choice>
    <Choice>No corresponding data found.</Choice>
    <Choice>Nothing stored under that key.</Choice>
    <Choice>That resource is missing.</Choice>
    <Choice>The requested item was not found.</Choice>
    <Choice>It's not in the system.</Choice>
    <Choice>Search failed to return results.</Choice>
    <Choice>There's no record of that.</Choice>
  </Random>
);

ResNotFound.displayName = "NotFound";

/**
 * **JoinNode** is a component from **@zeyah-bot/components** that joins its children's rendered output with a separator.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const JoinNode: Zeyah.FC<PropsWithInfo<{ by?: string }>> = ({
  childrenData,
  by = "\n",
}) => {
  return childrenData.map((i) => i.rendered).join(by);
};

/**
 * **Lang** is a namespace from **@zeyah-bot/components** for localization-related components.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export namespace Lang {
  /**
   * **Group** is a component that renders the **Type** child matching the current bot language.
   */
  export const Group: Zeyah.FC<PropsWithInfo> = ({ childrenData }) => {
    const config = getConfig();
    let valids = childrenData.filter(
      (i) =>
        i.fiber !== "string" &&
        i.fiber.type.displayName === Type.displayName &&
        i.fiber.props?.type === config.lang,
    ) as StrictZeyahChildren<Type>[];
    if (valids.length === 0) {
      valids = childrenData.filter(
        (i) =>
          i.fiber !== "string" &&
          i.fiber.type.displayName === Type.displayName &&
          (i.fiber.props?.type === "fallback" || i.fiber.props?.type === "en"),
      ) as StrictZeyahChildren<Type>[];
    }

    return valids.map((i) => i.getRendered()).join("");
  };

  export interface Type {
    type: LanguageTypeWithFallback;
  }

  /**
   * **Type** defines localized content for a specific language.
   */
  export const Type: Zeyah.FC<PropsWithInfo<Type>> = ({
    getChildrenString,
  }) => {
    return getChildrenString();
  };

  Group.displayName = "LangGroup";
  Type.displayName = "LangType";
}

export type DividerType = "classic" | "parallelogram";

export const DividerType: {
  [K in DividerType]: string;
} = {
  classic: UNIRedux.standardLine,
  parallelogram: "▱▱▱▱▱▱▱▱▱▱▱",
};

/**
 * **Divider** is a component from **@zeyah-bot/components** that renders a visual separator.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const Divider: Zeyah.FC<
  PropsWithInfo<{ break?: boolean; type?: DividerType }>
> = ({ break: break_ = true, type = "classic" }) => {
  let r = `\n${DividerType[type] ?? DividerType.classic}\n`;
  return !break_ ? r.trim() : r;
};

/**
 * **KakkoQuote** renders content inside Japanese corner brackets 『 』.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const KakkoQuote: Zeyah.FC<PropsWithInfo> = ({ getChildrenString }) => {
  return <>『 {getChildrenString} 』</>;
};

export const CornerQuote: Zeyah.FC<PropsWithInfo> = ({ getChildrenString }) => {
  return <>「 {getChildrenString} 」</>;
};

export const FancyBracketQuote: Zeyah.FC<PropsWithInfo> = ({
  getChildrenString,
}) => {
  return <>【 {getChildrenString} 】</>;
};

export const GuillemetsQuote: Zeyah.FC<PropsWithInfo> = ({
  getChildrenString,
}) => {
  return <>« {getChildrenString} »</>;
};

export const DoubleAngleQuote: Zeyah.FC<PropsWithInfo> = ({
  getChildrenString,
}) => {
  return <>《 {getChildrenString} 》</>;
};

export const WhiteCornerQuote: Zeyah.FC<PropsWithInfo> = ({
  getChildrenString,
}) => {
  return <>「 {getChildrenString} 」</>;
};

export const SmallQuote: Zeyah.FC<PropsWithInfo> = ({ getChildrenString }) => {
  return <>‹ {getChildrenString} ›</>;
};

export const HeavyBracketQuote: Zeyah.FC<PropsWithInfo> = ({
  getChildrenString,
}) => {
  return <>【 {getChildrenString} 】</>;
};

export const ParenthesisQuote: Zeyah.FC<PropsWithInfo> = ({
  getChildrenString,
}) => {
  return <>( {getChildrenString} )</>;
};

export const LeftKakko: Zeyah.FC<PropsWithInfo> = () => <>「</>;

export const RightKakko: Zeyah.FC<PropsWithInfo> = () => <>」</>;

export const LeftDoubleAngle: Zeyah.FC<PropsWithInfo> = () => <>《</>;

export const RightDoubleAngle: Zeyah.FC<PropsWithInfo> = () => <>》</>;

export const LeftGuillemet: Zeyah.FC<PropsWithInfo> = () => <>«</>;

export const RightGuillemet: Zeyah.FC<PropsWithInfo> = () => <>»</>;

export const LeftHeavyBracket: Zeyah.FC<PropsWithInfo> = () => <>【</>;

export const RightHeavyBracket: Zeyah.FC<PropsWithInfo> = () => <>】</>;

export const LeftCornerBracket: Zeyah.FC<PropsWithInfo> = () => <>『</>;

export const RightCornerBracket: Zeyah.FC<PropsWithInfo> = () => <>』</>;

export const LeftSingleQuote: Zeyah.FC<PropsWithInfo> = () => <>‘</>;

export const RightSingleQuote: Zeyah.FC<PropsWithInfo> = () => <>’</>;

export const LeftDoubleQuote: Zeyah.FC<PropsWithInfo> = () => <>“</>;

export const RightDoubleQuote: Zeyah.FC<PropsWithInfo> = () => <>”</>;

export const StarDecoration: Zeyah.FC<PropsWithInfo> = () => <>✦</>;
export const HeavyStarDecoration: Zeyah.FC<PropsWithInfo> = () => <>★</>;

export const SparkleDecoration: Zeyah.FC<PropsWithInfo> = () => <>✧</>;
export const AsteriskDecoration: Zeyah.FC<PropsWithInfo> = () => <>✻</>;

export const DiamondDecoration: Zeyah.FC<PropsWithInfo> = () => <>◆</>;
export const HollowDiamondDecoration: Zeyah.FC<PropsWithInfo> = () => <>◇</>;

export const TriangleRightDecoration: Zeyah.FC<PropsWithInfo> = () => <>▶</>;
export const TriangleLeftDecoration: Zeyah.FC<PropsWithInfo> = () => <>◀</>;

export const BulletSmall: Zeyah.FC<PropsWithInfo> = () => <>•</>;
export const BulletMedium: Zeyah.FC<PropsWithInfo> = () => <>∙</>;
export const BulletHeavy: Zeyah.FC<PropsWithInfo> = () => <>●</>;

export const DividerBar: Zeyah.FC<PropsWithInfo> = () => <>│</>;
export const DividerHeavyBar: Zeyah.FC<PropsWithInfo> = () => <>┃</>;

export const DashSmall: Zeyah.FC<PropsWithInfo> = () => <>–</>;
export const DashMedium: Zeyah.FC<PropsWithInfo> = () => <>—</>;

export const DiamondFloral: Zeyah.FC<PropsWithInfo> = () => <>❖</>;

export const DiscFilled: Zeyah.FC<PropsWithInfo> = () => <>●</>;
export const DiscMedium: Zeyah.FC<PropsWithInfo> = () => <>◉</>;
export const DiscHollow: Zeyah.FC<PropsWithInfo> = () => <>○</>;

export const ArrowRightMedium: Zeyah.FC<PropsWithInfo> = () => <>➤</>;
export const WhateverThisWas1: Zeyah.FC<PropsWithInfo> = () => <>╰ </>;

export {
  Bold,
  Break,
  CassFormat,
  CassProps,
  Code,
  CodeBlock,
  CodeBlockProps,
  Indent,
  Italic,
  Heading,
  HeadingProps,
  Line,
  Link,
  LinkProps,
  List,
  ListItem,
  ListProps,
  Platform,
  Quote,
  Repeated,
  Spoiler,
  Text,
  UniFont,
} from "@kayelaa/zeyah";

export namespace Duke {
  export interface BasketBallProps {
    feedback: string;
    outcome: "won" | "lost";
    amount: Decimal;
  }
  export const BasketBall: Zeyah.FC<PropsWithInfo<BasketBallProps>> = ({
    amount = Decimal(0),
    feedback,
    outcome,
    getChildrenString,
  }) => {
    return (
      <>
        <Code>{feedback}</Code>
        <Breaks n={2} />
        <Divider break={false} />
        {/* Dollar sign, not ${} of `` */}
        {/* Pls don't merge this in one line prettier.
         */}
        <Break />
        <BoldItalic>
          {outcome === "won"
            ? "You won:"
            : outcome === "lost"
              ? "You lost:"
              : "Wtf did you put in the outcome params."}
        </BoldItalic>
        <Break />${addCommas(amount)} 💵
        {getChildrenString()}
      </>
    );
  };
}

export const BoldItalic: Zeyah.FC<PropsWithInfo> = ({ getChildrenString }) => {
  return (
    <>
      <Platform type="discord">***{getChildrenString()}***</Platform>
      <Platform type="facebook">
        <UniFont type="bold_italic"></UniFont>
      </Platform>
    </>
  );
};

export namespace Semantics {
  export const Title: Zeyah.FC<PropsWithInfo> = ({ getChildrenString }) => {
    return getChildrenString();
  };
  Title.displayName = "Semantics.Title";

  export const Content: Zeyah.FC<PropsWithInfo> = ({ getChildrenString }) => {
    return getChildrenString();
  };
  Title.displayName = "Semantics.Content";

  export const Footer: Zeyah.FC<PropsWithInfo> = ({ getChildrenString }) => {
    return getChildrenString();
  };
  Title.displayName = "Semantics.Footer";
}

/**
 * **NicaHeader** is a component from **@zeyah-bot/components** that renders a header with a user icon and name.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const NicaHeader: Zeyah.FC<PropsWithInfo<{ name: string }>> = ({
  getChildrenString,
  name = "???",
}) => {
  return (
    <>
      <Bold>👤 {name}</Bold>
      <Breaks n={2} />
      {getChildrenString()}
    </>
  );
};

/**
 * Hey, Credits: Mrkimsters / Symer
 * ===
 * I literally stole this design from **Astral** hehe.
 */
/**
 * **AstralHelpOption** is a component from **@zeyah-bot/components** that renders a formatted help option for a command.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
export const AstralHelpOption: Zeyah.FC<
  PropsWithInfo<{
    emoji: string;
    prefix: string;
    description: string;
    commandName: string;
    optionalVer?: SemVerLiteral;
  }>
> = ({ emoji, prefix, description, commandName, optionalVer }) => {
  return (
    <>
      {emoji}{" "}
      <Bold>
        {prefix}
        {commandName}
      </Bold>
      {optionalVer ? (
        <>
          {" "}
          <Italic>@{optionalVer}</Italic>
        </>
      ) : null}
      <br />
      <WhateverThisWas1 /> <Text>{description}</Text>
    </>
  );
};
