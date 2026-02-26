import { getStreamFromURL } from "@zeyah-bot/utils";

export const CouldRead = module.register({
  emoji: "👁️",
  name: "couldread",
  version: "1.0.0",
  author: ["@lianecagara", "@popcat"],
  pluginNames: [],
  description:
    "Generates an 'if those kids could read they'd be very upset' meme.",
  WrapperFC({ getChildrenString }) {
    return (
      <Comps.CassFormat
        title="👁️ Could Read Meme"
        fbContentFont="fancy"
        fbTitleFont="bold"
      >
        {getChildrenString()}
      </Comps.CassFormat>
    );
  },
  async onCommand({ zeyahIO, args }) {
    const meme = args.join(" ");
    if (!meme.trim()) {
      await zeyahIO.reply(<>⚠️ Enter meme phrase to put.</>);
      return;
    }

    const searching = await zeyahIO.reply(<>🔎 Processing...</>);

    const stream = await getStreamFromURL(
      "https://api.popcat.xyz/v2/couldread",
      {
        params: {
          text: meme,
        },
      },
    );

    await zeyahIO.unsend(searching);

    await zeyahIO.reply(<>Here's the image:</>).setAttachments([
      {
        name: "couldRead.png",
        stream,
      },
    ]);
  },
});
