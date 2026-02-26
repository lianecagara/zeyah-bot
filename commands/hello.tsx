import { Bold, Italic, Line, List, ListItem, Text } from "@kayelaa/zeyah";
import {
  DiscordMention,
  Embed,
  EmbedDescription,
  EmbedFooter,
  EmbedTitle,
  JoinNode,
  JSONStr,
} from "@zeyah-bot/components";
import { clamp, random56Bit, randomArrayValue, randomInt } from "@zeyah-utils";
import Decimal from "decimal.js";

function testRandom(fn: () => number, n = 100000) {
  let sum = 0;
  let sumSq = 0;

  for (let i = 0; i < n; i++) {
    const x = fn();
    sum += x;
    sumSq += x * x;
  }

  const mean = sum / n;
  const variance = sumSq / n - mean * mean;

  return { mean, variance };
}

export const HelloOLD = module.register({
  emoji: "😺",
  pluginNames: ["six-seven"],
  name: "hello",
  aliases: ["hi"],
  author: "@lianecagara",
  version: "1.0.0",
  description: "Just replies with a hello.",
  async onCommand({
    args,
    currentCommand,
    commandName,
    event,
    zeyahIO,
    sixSeven,
    commandProp,
    message,
    currentPrefix,
    commandBase,
    hasPrefix,
    messageWords,
  }) {
    if (commandProp === "debugargs") {
      await zeyahIO.reply(
        <>
          <JoinNode by={"\n"}>
            {message}
            {JSON.stringify(
              {
                commandName,
                message,
                currentPrefix,
                args,
                hasPrefix,
                messageWords,
              },
              null,
              2,
            )}
          </JoinNode>
        </>,
      );
      return;
    }
    if (args[0] === "bb") {
      await zeyahIO.reply(
        <>
          <Comps.Duke.BasketBall
            amount={Decimal("1e309")}
            feedback="Idk wtf is going on"
            outcome="won"
          />
        </>,
      );
      return;
    }
    if (args[0] === "rng-sanity") {
      const times = clamp(Number(args[1]) || 100000, 1, 2_000_000);
      const res = testRandom(random56Bit);
      await zeyahIO.reply(
        <>
          <List>
            <ListItem>
              <Bold>Times: </Bold> {times}
            </ListItem>
            <ListItem>
              <Bold>Mean: </Bold> {res.mean}
            </ListItem>
            <ListItem>
              <Bold>Variance: </Bold> {res.variance}
            </ListItem>
          </List>
        </>,
      );
      return;
    }
    if (args[0] === "rng") {
      const fruits = ["🍎", "🍌", "🍇", "🍒", "🍉", "🍍"];

      await zeyahIO.reply(
        <>
          {random56Bit()}
          <br />
          {random56Bit().toFixed(5)}
          <br />
          {randomInt(100, 200)} [100, 200]
          <br />[{" "}
          {[
            randomArrayValue(fruits),
            randomArrayValue(fruits),
            randomArrayValue(fruits),
          ].join(", ")}{" "}
          ]
        </>,
      );
      return;
    }
    if (args[0] === "ment") {
      await zeyahIO.reply(
        <>
          Hello, <DiscordMention event={event} />!
        </>,
      );
      return;
    }
    if (args[0] === "json") {
      await zeyahIO.reply(
        <>
          <JSONStr data={event} />
        </>,
      );
      return;
    }
    if (args[0] === "embed") {
      await zeyahIO.reply(
        <>
          <Text>Lol BTW:</Text>
          <Embed>
            <EmbedTitle>Fun Facts #{sixSeven}</EmbedTitle>
            <EmbedDescription>Cats can sleep 16 hours a day!</EmbedDescription>
            <EmbedFooter>Powered by Zeyah</EmbedFooter>
          </Embed>
        </>,
      );
    }
    await zeyahIO.reply(
      <>
        Hello, <Bold>World!</Bold>
        <br />
        <Italic>Helloooo.....</Italic>
        <br />
        <Line />
        <br />
        <Bold>Rules!!!</Bold>
        <br />
        <List ordered boldPrefix>
          {[
            "cute si liane",
            "kayelaa na name ni liane",
            "axera-fca tomorrow",
            "may jsx na",
            "ok madam",
          ].map((i) => (
            <ListItem>{i}</ListItem>
          ))}
        </List>
      </>,
    );
  },
});

export const Hello = module.register({
  emoji: "😺",
  pluginNames: [],
  name: "hello",
  aliases: ["hi"],
  author: "@lianecagara",
  version: "2.0.0",
  description: "Just replies with a hello.",
  async onCommand({ args, currentCommand, commandName, event, zeyahIO }) {
    zeyahIO.reply(<>Hello!</>);
  },
});
