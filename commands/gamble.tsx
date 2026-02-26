import { Bold, Code, Italic } from "@kayelaa/zeyah";
import { ZeyahAdapter } from "@zeyah-bot/adapters/base";
import { Points } from "@zeyah-bot/components";
import { biasedRandom, randomInt } from "@zeyah-utils";
import Decimal from "decimal.js";

export const GambleEvent = module.register({
  emoji: "🎮",
  name: "gamble",
  version: "1.0.0",
  author: "@lianecagara",
  description: "Chaotic gamble chest game",
  notCommand: true,

  async onCommand({ zeyahIO, userDB: user }) {
    let baseScale = 1;

    const clampPoints = (value: Decimal) => Decimal.max(0, value);

    const roll = () => biasedRandom(2.2);

    const rewardScale = () => {
      return 1 + Math.log(1 + baseScale) * 0.025;
    };

    const randomRange = randomInt;

    const applyDelta = async (delta: number) => {
      const points = await user.getPoints();
      await user.setPoints(clampPoints(points.plus(delta)));
    };

    const decayMap = new Map<"SAFE" | "RISKY" | "GAMBLE", number>();

    const startListener = async (
      listener: ZeyahAdapter.NoPromiseZeyahDispatched,
    ) => {
      listener.listenReplies({ timeout: 30000 });

      listener.on("reply", async (_io, ev) => {
        listener.stopListenReplies();

        const choice = ev.body.trim().toUpperCase();

        let delta = 0;
        const scale = rewardScale();

        /*
          Outcome Model

          SAFE:
          - Low cost
          - Medium reward
          - Chance of nothing

          RISKY:
          - High cost
          - High jackpot
          - Higher lose chance

          GAMBLE:
          - Balanced chaos
        */

        if (choice === "SAFE") {
          const r = roll();

          if (r < 0.65) delta = randomRange(5, 40) * scale;
          else if (r < 0.85) delta = randomRange(40, 100) * scale;
          else if (r < 0.95) delta = -randomRange(10, 50) * scale;
          else delta = randomRange(300, 800) * scale;
        } else if (choice === "RISKY") {
          const r = roll();

          if (r < 0.3) delta = randomRange(50, 250) * scale;
          else if (r < 0.55) delta = randomRange(0, 50) * scale;
          else if (r < 0.8) delta = -randomRange(50, 200) * scale;
          else delta = randomRange(800, 2000) * scale;
        } else if (choice === "GAMBLE") {
          const r = roll();

          if (r < 0.4) delta = randomRange(20, 120) * scale;
          else if (r < 0.7) delta = randomRange(0, 30) * scale;
          else if (r < 0.9) delta = -randomRange(20, 100) * scale;
          else delta = randomRange(500, 1500) * scale;
        } else {
          const res = await zeyahIO.reply("❌ Invalid choice.");
          await startListener(res);
          return;
        }

        const decay = decayMap.get(choice) ?? 1;

        if (delta >= 0) delta = delta * decay;
        else delta = delta / decay;

        const newDecay = Math.pow(decay, 0.7);

        decayMap.set(choice, newDecay);

        baseScale += 0.02;

        await applyDelta(Math.floor(delta));

        const points = await user.getPoints();

        const res = await zeyahIO.reply(
          <>
            🎰 Result: {delta >= 0 ? "+" : ""}
            {Math.floor(delta)} Points
            <br />
            💰 Total: <Points n={points}></Points>
            <br />
            <br />
            <Italic>Reply SAFE | RISKY | GAMBLE</Italic>
          </>,
        );

        await startListener(res);
      });
    };

    const resInit = await zeyahIO.reply(
      <>
        <Bold> 🎰 Chaos Chest Casino</Bold>
        <br />
        <br />
        <Italic>Choose your gamble:</Italic>
        <br />
        <Code>SAFE</Code> — low risk, medium chaos
        <br />
        <Code>RISKY</Code> — high risk, high jackpot
        <br />
        <Code>GAMBLE</Code> — balanced madness
        <br />
        <br />
        <Italic>Reply SAFE | RISKY | GAMBLE</Italic>
      </>,
    );

    await startListener(resInit);
  },
  pluginNames: [],
});
