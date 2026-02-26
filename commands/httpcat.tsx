import { Bold, Code } from "@zeyah-bot/components";
import { getStreamFromURL } from "@zeyah-bot/utils";
import { HttpStatusCode } from "axios";

export const CouldRead = module.register({
  emoji: "🐈",
  name: "httpcat",
  version: "1.0.0",
  author: ["@lianecagara", "@http.cat"],
  pluginNames: [],
  description: "Generates a cat meme photo related to an HTTP Status code.",
  WrapperFC({ getChildrenString }) {
    return (
      <Comps.CassFormat
        title="🐈 HttpCat"
        fbContentFont="fancy"
        fbTitleFont="bold"
      >
        {getChildrenString()}
      </Comps.CassFormat>
    );
  },
  async onCommand({ zeyahIO, args }) {
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
      await zeyahIO.reply(<>⚠️ Invalid Http Status Code.</>);
      return;
    }

    const codeName = HttpStatusCode[code];

    const stream = await getStreamFromURL(`https://http.cat/${code}`);

    await zeyahIO
      .reply(
        <>
          <Bold>Code: </Bold> {code} (<Code>{codeName}</Code>)
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
