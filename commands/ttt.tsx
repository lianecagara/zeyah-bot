import Zeyah, { Bold, Code, Text } from "@kayelaa/zeyah";
import { Breaks, Choice, Random, Points } from "@zeyah-bot/components";
import Decimal from "decimal.js";
import { Cell, TictactoeAI } from "@commands/utils/ttt-ai";
import { ZeyahAdapter } from "@zeyah-bot/adapters/base";
import { pickRandom, shuffle } from "@zeyah-utils";

export const TttEvent = module.register({
  emoji: "⭕",
  name: "ttt",
  version: "1.1.0",
  author: "@lianecagara",
  description: "Play TicTacToe vs AI",

  async onCommand({ zeyahIO, usersDB }) {
    const [myCell, aiCell] = shuffle<Cell>(["X", "O"]);
    const ai = new TictactoeAI({
      noiseChance: 0.15,
      aiPlayer: aiCell,
      huPlayer: myCell,
    });
    const myEmoji = ai.getEmoji(myCell);
    const aiEmoji = ai.getEmoji(aiCell);

    const StatusNode: Zeyah.FC = () => (
      <>
        <Breaks n={2} />
        <Bold>
          🎮 You: {myEmoji} | AI: {aiEmoji}
        </Bold>
      </>
    );

    const BASE_REWARD = 20_000;
    const DRAW_REWARD = 3_000;

    const letterMap: Record<string, number> = {
      A: 0,
      B: 1,
      C: 2,
    };

    const numberMap: Record<string, number> = {
      "1": 0,
      "2": 1,
      "3": 2,
    };

    const rewardPlayer = async (senderID: string, reward: number) => {
      const user = usersDB.getUser(senderID);
      const points = await user.getPoints();

      await user.setPoints(points.plus(new Decimal(reward)));
    };

    const renderBoard = () => ai.toString();

    const startReplyListener = async (
      listener: ZeyahAdapter.NoPromiseZeyahDispatched,
    ) => {
      listener.listenReplies({ timeout: 30 * 1000 });
      listener.on("reply", async (_io, ev) => {
        listener.stopListenReplies();

        const input = ev.body.trim().toUpperCase();

        if (input.length !== 2) {
          const res = await zeyahIO.reply("❌ Invalid move format.");
          await startReplyListener(res);
          return;
        }

        const x = letterMap[input[0]];
        const y = numberMap[input[1]];

        if (x === undefined || y === undefined) {
          const res = await zeyahIO.reply("❌ Invalid move.");
          await startReplyListener(res);
          return;
        }

        const playerMove = ai.makePlayerMove({ x, y });

        if (!playerMove) {
          const res = await zeyahIO.reply("❌ Move not allowed.");
          await startReplyListener(res);
          return;
        }

        let winner = ai.checkWinner(ai.board);
        let draw = ai.isDraw(ai.board);

        const senderID = ev.senderID;

        if (winner || draw) {
          let reward = 0;

          if (draw) {
            reward = DRAW_REWARD;
          } else if (winner === ai.huPlayer) {
            reward = BASE_REWARD * 5;
          }

          if (reward > 0) {
            await rewardPlayer(senderID, reward);
          }

          await zeyahIO.reply(
            <>
              <Bold>{draw ? "🤝 Draw!" : `🏆 ${winner} wins!`}</Bold>
              <Breaks n={2} />
              <Text>{ai.toString()}</Text>
              <Breaks n={2} />
              Reward: <Points n={new Decimal(reward)} />
              <StatusNode />
            </>,
          );

          return;
        }

        ai.makeAiMove();

        const res2 = await zeyahIO.reply(
          <>
            <Bold>🤖 AI moved!</Bold>
            <Breaks n={2} />
            <Text>{ai.toString()}</Text>
            <StatusNode />
          </>,
        );

        await startReplyListener(res2);
      });
    };

    const resInit = await zeyahIO.reply(
      <>
        <Bold>
          <Random>
            <Choice>🎮 TicTacToe Battle</Choice>
            <Choice>🤖 Face the AI</Choice>
            <Choice>⚔️ Challenge accepted</Choice>
          </Random>
        </Bold>
        <StatusNode />
        <Breaks n={2} />
        <Text>{renderBoard()}</Text>
        <Breaks n={2} />
        Reply with move (A1, B2, C3)
      </>,
    );

    await startReplyListener(resInit);
  },

  pluginNames: [],
});
