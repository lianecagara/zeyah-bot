import Zeyah, { Bold, CassFormat, Code, PropsWithInfo } from "@kayelaa/zeyah";
import { getStreamFromURL } from "@zeyah-bot/utils";
import { HttpStatusCode } from "axios";

export const CouldRead = module.register({
  emoji: "🐈",
  name: "httpcat",
  version: "1.0.0",
  author: ["@lianecagara", "@http.cat"],
  pluginNames: [],
  description: "Generates a cat meme photo related to an HTTP Status code.",
  async onCommand({ zeyahIO, args }) {
    const Format: Zeyah.FC<PropsWithInfo> = ({ getChildrenString }) => {
      return (
        <CassFormat title="🐈 HttpCat" fbContentFont="fancy" fbTitleFont="bold">
          {getChildrenString()}
        </CassFormat>
      );
    };
    const rawInput = args.join(" ").trim();

    let code: number | null = null;

    const num = Number(rawInput);

    if (!Number.isNaN(num)) {
      code = num in HttpStatusCode ? num : null;
    } else {
      type Keys = keyof typeof HttpStatusCode;

      const upper = rawInput.toUpperCase() as Keys;

      if (upper in HttpStatusCode) {
        code = HttpStatusCode[upper];
      }
    }

    if (code === null || !(code in HttpStatusCode)) {
      await zeyahIO.reply(<Format>⚠️ Invalid Http Status Code.</Format>);
      return;
    }

    const codeName = HttpStatusCode[code];

    const stream = await getStreamFromURL(`https://http.cat/${code}`);

    await zeyahIO
      .reply(
        <>
          <Format>
            <Bold>Code: </Bold> {code} (<Code>{codeName}</Code>)
          </Format>
        </>,
      )
      .setAttachments([
        {
          name: `httpcat-${code}.png`,
          stream,
        },
      ]);
  },
});
