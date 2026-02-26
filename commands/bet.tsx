import { Bold } from "@kayelaa/zeyah";
import { Points } from "@zeyah-bot/components";

export const BetCommand = module.register({
  name: "bet",
  emoji: "💰",
  author: "@jules",
  version: "1.0.0",
  description: "Bet your points!",
  async onCommand({ zeyahIO, userDB, args }) {
    const balance = await userDB.getPoints(); // Returns Decimal
    const amount = utils.parseBetDecimal(args[0], balance);

    if (amount.lte(0) || amount.gt(balance)) {
      return zeyahIO.reply(<>Invalid bet amount!</>);
    }

    const sent = await zeyahIO.reply(
      <>
        You are betting <Points n={amount} />. Are you sure? Reply with{" "}
        <Bold>yes</Bold> to confirm.
      </>,
    );

    // Inline Listener Edge Case: Handling context locally
    sent.listenReplies({ timeout: 15000 });
    sent.on("reply", async (replyIO, event) => {
      const balance = await userDB.getPoints(); // Refresh
      if (event.body.toLowerCase() === "yes") {
        const win = Math.random() > 0.5;
        const newBalance = win ? balance.add(amount) : balance.sub(amount);
        await userDB.setPoints(newBalance);

        await replyIO.reply(
          win ? (
            <>
              🎉 You won! New balance: <Points n={newBalance} />
            </>
          ) : (
            <>💀 You lost everything.</>
          ),
        );
      }
      sent.stopListenReplies();
    });
  },
});
