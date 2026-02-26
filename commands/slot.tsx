import { Bold, Text } from "@kayelaa/zeyah";
import {
  Breaks,
  Choice,
  Points,
  Random,
  ResWrongInput,
} from "@zeyah-bot/components";
import { parallel, parseBetDecimal, randomArrayValue } from "@zeyah-utils";

declare global {
  interface GlobalUserDBProps {
    slotWins: string;
  }
}

export const SlotEvent = module.register({
  emoji: "🎰",
  name: "slot",
  version: "1.0.0",
  author: "@lianecagara",
  aliases: ["fruit", "slots"],
  description: "Fruit slot gamble command",

  async onCommand({ zeyahIO, event, args, userDB: user }) {
    const [betRaw] = args;

    const [slotWins, points] = await parallel(
      user.getDecimal("slotWins"),
      user.getPoints(),
    );
    const bet = parseBetDecimal(betRaw, points);

    if (!bet || bet.lte(0)) {
      await zeyahIO.reply(<ResWrongInput />);
      return;
    }

    if (points.lessThan(bet)) {
      await zeyahIO.reply("💸 Not enough points to bet that much.");
      return;
    }

    const fruits = ["🍎", "🍌", "🍇", "🍒", "🍉", "🍍"];

    const roll = [
      randomArrayValue(fruits),
      randomArrayValue(fruits),
      randomArrayValue(fruits),
    ];

    const [a, b, c] = roll;

    let multiplier = -1;

    if (a === b && b === c) {
      multiplier = 2;
    } else if (a === b || a === c || b === c) {
      multiplier = 1;
    }

    const delta = bet.mul(multiplier);
    const newPoints = points.plus(delta);
    const newSlotWins = slotWins.add(delta);
    await parallel(
      user.setDecimal("slotWins", newSlotWins),
      user.setPoints(newPoints),
    );
    const bm = delta;
    const bn = bet.mul(-1);

    const resultText =
      multiplier > 0 ? (
        <Random>
          <Choice>
            🎉 You win <Points n={bm}></Points> points!
          </Choice>
          <Choice weight={2}>
            🔥 Lucky hit! <Points n={bm}></Points> points!
          </Choice>
          <Choice>
            ✨ Fortune smiles — you gain <Points n={bm}></Points> points!
          </Choice>
          <Choice>
            🍀 Destiny approves (<Points n={bm}></Points>)
          </Choice>
          <Choice>
            💰 Riches flow! <Points n={bm}></Points>
          </Choice>
          <Choice>
            🎰 Jackpot energy — <Points n={bm}></Points> points!
          </Choice>
          <Choice>
            🫶 Luck carried you (<Points n={bm}></Points>)
          </Choice>
          <Choice>
            🌟 Shiny victory! <Points n={bm}></Points>
          </Choice>
          <Choice>
            🚀 Point rocket: <Points n={bm}></Points>
          </Choice>
          <Choice>
            🎊 Celebration! <Points n={bm}></Points> points added
          </Choice>
        </Random>
      ) : multiplier < 0 ? (
        <Random>
          <Choice>
            😭 You lost <Points n={bet}></Points> points!
          </Choice>
          <Choice weight={2}>
            💸 Oof… <Points n={bet}></Points> points vanished.
          </Choice>
          <Choice>
            🫠 Not your day. <Points n={bn}></Points> points.
          </Choice>
          <Choice>
            😔 The slot demands sacrifice (<Points n={bet}></Points>)
          </Choice>
          <Choice>
            🎰 The fruits were unkind — lost <Points n={bet}></Points>
          </Choice>
          <Choice>
            ⚠️ <Points n={bet}></Points> points went somewhere mysterious…
          </Choice>
          <Choice>
            💀 Economy remembers — <Points n={bet}></Points> lost
          </Choice>
          <Choice>
            🌑 Dark slot energy — minus <Points n={bet}></Points>
          </Choice>
          <Choice>
            🥀 Luck left the chat. <Points n={bn}></Points>
          </Choice>
          <Choice>
            😵 Gambling moment. <Points n={bet}></Points> gone.
          </Choice>
        </Random>
      ) : (
        <Random>
          <Choice>😐 No change this round.</Choice>
          <Choice weight={2}>🤷 The slot stays silent.</Choice>
          <Choice>🎰 Close, but nothing happens.</Choice>
          <Choice>🌫️ The fruits whispered nothing.</Choice>
          <Choice>🧊 Neutral outcome.</Choice>
          <Choice>✨ Almost, but not quite.</Choice>
          <Choice>🎲 The universe is undecided.</Choice>
          <Choice>😶 Nothing moved.</Choice>
          <Choice>🍃 The wind passed by.</Choice>
        </Random>
      );

    const uiFormat = (
      <Random>
        <Choice>
          🎲 Roll: {roll.join(" ")}
          <br />
          💰 Bet: <Points n={bet}></Points>
          <br />
          <Text noEscape>{resultText}</Text>
        </Choice>

        <Choice>
          🎰 Results → {roll.join(" ")}
          <Breaks n={1} />
          💵 Wager: <Points n={bet}></Points>
          <Breaks n={1} />
          <Text noEscape>{resultText}</Text>
        </Choice>

        <Choice>
          📊 Slot Outcome
          <Breaks n={1} />• Roll: {roll.join(" ")}
          <br />• Bet Size: <Points n={bet}></Points>
          <Breaks n={1} />
          <Text noEscape>{resultText}</Text>
        </Choice>

        <Choice>
          ✨ The machine speaks:
          <Breaks n={1} />
          Roll = {roll.join(" ")}
          <br />
          Stake = <Points n={bet}></Points>
          <Breaks n={1} />
          <Text noEscape>{resultText}</Text>
        </Choice>
      </Random>
    );

    await zeyahIO.reply(
      <>
        <Bold>
          <Random>
            <Choice>🎰 Fruit Slot</Choice>
            <Choice>🍀 Lucky Spin</Choice>
            <Choice>🎲 Casino Moment</Choice>
            <Choice>✨ Let the fruits decide</Choice>
            <Choice>🍒 Slot Machine Noise</Choice>
          </Random>
        </Bold>
        <Breaks n={2} />
        {uiFormat}
      </>,
    );
  },

  pluginNames: [],
});
