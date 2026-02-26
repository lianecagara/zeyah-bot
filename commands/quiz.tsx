import { Bold, Code } from "@kayelaa/zeyah";
import { Breaks, Choice, Lang, Points, Random } from "@zeyah-bot/components";
import Decimal from "decimal.js";
import axios from "axios";
import { shuffle } from "@zeyah-utils";

export const QuizEvent = module.register({
  emoji: "💬",
  name: "quiz",
  version: "2.0.0",
  author: "@lianecagara",
  description: "Answer trivia. Earn points.",

  async onCommand({ zeyahIO, userDB: user }) {
    const res = await axios.get<TriviaResponse>("https://opentdb.com/api.php", {
      params: {
        amount: 1,
        type: "multiple",
      },
    });

    const { data } = res;
    const q = data.results?.[0];

    if (!q) {
      await zeyahIO.reply("⚠️ Quiz API failed.");
      return;
    }

    const correct = q.correct_answer;
    const options = shuffle([...q.incorrect_answers, correct]);

    const letters = ["A", "B", "C", "D"];

    const formatted = options
      .map((opt, i) => utils.cleanAnilistHTML(`${letters[i]}. ${opt}`))
      .join("\n");

    const dispatched = await zeyahIO.reply(
      <>
        <Bold>
          <Random>
            <Choice>🧠 Trivia Time</Choice>
            <Choice>📚 Brain Check</Choice>
            <Choice>🎯 Knowledge Test</Choice>
          </Random>
        </Bold>
        <Breaks n={2} />❓ {utils.cleanAnilistHTML(q.question)}
        <Breaks n={1} />
        {formatted}
        <Breaks n={2} />
        <Code>Reply with A / B / C / D (30s)</Code>
      </>,
    );

    await dispatched.listenReplies({ timeout: 30000 });

    dispatched.on("reply", async (_io, replyEv) => {
      const answer = replyEv.body.trim().toUpperCase();
      const index = letters.indexOf(answer);

      if (index === -1) return;

      dispatched.stopListenReplies();

      const chosen = options[index];

      if (chosen === correct) {
        const reward = new Decimal(10_000);

        const points = await user.getPoints();

        await user.setPoints(points.plus(reward));

        await zeyahIO.reply(
          <>
            <Bold>
              <Random>
                <Choice>
                  <Lang.Group>
                    <Lang.Type type="en">✅ Correct!</Lang.Type>
                    <Lang.Type type="tl">✅ Tama!</Lang.Type>
                    <Lang.Type type="ow">✅ Kurik Sir!</Lang.Type>
                  </Lang.Group>
                </Choice>
                <Choice>
                  <Lang.Group>
                    <Lang.Type type="en">🔥 Big brain energy</Lang.Type>
                    <Lang.Type type="tl">🔥 Astig ang utak mo</Lang.Type>
                    <Lang.Type type="ow">🔥 Grabe ka sharp ba</Lang.Type>
                  </Lang.Group>
                </Choice>
                <Choice>
                  <Lang.Group>
                    <Lang.Type type="en">🎉 You nailed it!</Lang.Type>
                    <Lang.Type type="tl">🎉 Swak na swak!</Lang.Type>
                    <Lang.Type type="ow">🎉 Sakto gid ya!</Lang.Type>
                  </Lang.Group>
                </Choice>
              </Random>
            </Bold>
            <Breaks n={2} />
            Earned: <Points n={reward}></Points>
          </>,
        );
      } else {
        await zeyahIO.reply(
          <>
            <Bold>
              <Random>
                <Choice>❌ Wrong!</Choice>
                <Choice>😅 Not quite</Choice>
                <Choice>🫠 Almost...</Choice>
              </Random>
            </Bold>
            <Breaks n={2} />
            Correct answer: <Code>{correct}</Code>
          </>,
        );
      }
    });
  },

  pluginNames: [],
});

export interface TriviaResponse {
  /**
   * 0: Success, 1: No Results, 2: Invalid Parameter,
   * 3: Token Not Found, 4: Token Empty
   */
  response_code: number;
  results: TriviaQuestion[];
}

export interface TriviaQuestion {
  type: "multiple" | "boolean";
  difficulty: "easy" | "medium" | "hard";
  category: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}
