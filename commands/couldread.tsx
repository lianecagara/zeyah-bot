import Zeyah, { CassFormat, PropsWithInfo } from "@kayelaa/zeyah";
import { getStreamFromURL } from "@zeyah-bot/utils";

export const CouldRead = module.register({
  emoji: "👁️",
  name: "couldread",
  version: "1.0.0",
  author: ["@lianecagara", "@popcat"],
  pluginNames: [],
  description:
    "Generates an 'if those kids could read they'd be very upset' meme.",
  async onCommand({ zeyahIO, args }) {
    const Format: Zeyah.FC<PropsWithInfo> = ({ getChildrenString }) => {
      return (
        <CassFormat
          title="👁️ Could Read Meme"
          fbContentFont="fancy"
          fbTitleFont="bold"
        >
          {getChildrenString()}
        </CassFormat>
      );
    };
    const meme = args.join(" ");
    if (!meme.trim()) {
      await zeyahIO.reply(<Format>⚠️ Enter meme phrase to put.</Format>);
      return;
    }

    const searching = await zeyahIO.reply(<Format>🔎 Processing...</Format>);

    const stream = await getStreamFromURL(
      "https://api.popcat.xyz/v2/couldread",
      {
        params: {
          text: meme,
        },
      },
    );

    await zeyahIO.unsend(searching);

    await zeyahIO
      .reply(
        <>
          <Format>Here's the image:</Format>
        </>,
      )
      .setAttachments([
        {
          name: "couldRead.png",
          stream,
        },
      ]);
  },
});
