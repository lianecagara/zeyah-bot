import { Bold, Italic, List, ListItem } from "@kayelaa/zeyah";
import { Breaks, Choice, Divider, Points, Random } from "@zeyah-bot/components";
import { parseBetDecimal } from "@zeyah-utils";
import Decimal from "decimal.js";

export const BalanceEvent = module.register({
  name: "points",
  version: "1.0.0",
  author: "@lianecagara",
  aliases: ["bal", "money", "pts"],
  description: "Show your points. Use bal-top for the richest.",
  emoji: "🎯",
  async onCommand({ zeyahIO, args, userDB: user, commandProp, usersDB }) {
    if (commandProp === "format" && args.at(0)) {
      const num = parseBetDecimal(args.at(0));
      await zeyahIO.reply(<Points n={num} />);
      return;
    }
    if ([commandProp, args.at(0)].includes("top")) {
      const allUsers = await usersDB.getAllUsers();

      const leaderboard: { name: string; points: Decimal }[] = [];

      for (const user of allUsers.values()) {
        try {
          const points = await user.getPoints();
          const username = await user.getUsername("Discord");

          leaderboard.push({
            name: username ?? "Unknown",
            points,
          });
        } catch {
          continue;
        }
      }

      leaderboard.sort((a, b) => b.points.cmp(a.points));

      const top5 = leaderboard.slice(0, 5);

      await zeyahIO.reply(
        <>
          <Bold>
            <Random>
              {/* Wala ako maisip gago */}
              <Choice>💰 Top 5 Richest Users</Choice>
              <Choice>🏆 Wealth Leaderboard</Choice>
              <Choice>🔥 Who is stacking points?</Choice>
              <Choice>📊 Economy Kings Ranking</Choice>
              <Choice weight={2}>✨ Top 5 Biggest Wallets</Choice>
            </Random>
          </Bold>{" "}
          <Divider break />
          <List ordered boldPrefix>
            {top5.length === 0 ? (
              <Italic>Nothing here yet… the economy is lonely 😭</Italic>
            ) : (
              top5.map((u) => (
                <ListItem>
                  <Bold>{u.name}</Bold>
                  <br />
                  <Points n={u.points} />
                  <Breaks n={1} />
                </ListItem>
              ))
            )}
          </List>
        </>,
      );
      return;
    }
    const points = await user.getPoints();

    await zeyahIO.reply(
      <>
        <Bold>
          <Random>
            <Choice>💰 Wallet Check!</Choice>
            <Choice>🪙 Here's your imaginary fortune</Choice>
            <Choice>📊 Your non-existent bank says hi</Choice>
            <Choice>😭 Bro is broke? Let's see</Choice>
          </Random>
        </Bold>
        <Divider break />

        <Italic>My Points</Italic>
        <br />
        <Points n={points} />
        <Breaks n={2} />
        <Random>
          <Choice>✨ Keep grinding fr</Choice>
          <Choice>🫵 Don't spend it all in one place</Choice>
          <Choice weight={2}>🔥 Wealthy… in spirit</Choice>
          <Choice>😭 Inflation hit even here</Choice>
        </Random>
      </>,
    );
  },
  pluginNames: [],
});
