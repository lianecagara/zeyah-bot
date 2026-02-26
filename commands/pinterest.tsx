import { ZeyahAdapter } from "@zeyah-bot/adapters/base";
import axios from "axios";
import Stream from "node:stream";

export const Pint = module.register({
  emoji: "📷",
  name: "pinterest",
  version: "1.0.0",
  author: ["@lianecagara", "@pixabay"],
  pluginNames: [],
  description: "Searches pinterest.",
  WrapperFC({ getChildrenString }) {
    return (
      <Comps.CassFormat
        title="📷 Pinterest"
        fbContentFont="fancy"
        fbTitleFont="bold"
      >
        {getChildrenString()}
      </Comps.CassFormat>
    );
  },
  async onCommand({ zeyahIO, args }) {
    const query = args.join(" ");
    if (!query.trim()) {
      await zeyahIO.reply(<>⚠️ Enter image to search.</>);
      return;
    }

    const searching = await zeyahIO.reply(
      <>🔎 Searching images, please wait...</>,
    );

    const response = await axios.get("https://pixabay.com/api/", {
      params: {
        key: "53680443-94033f6926681e037f6aece42",
        q: query.replace(/\s+/g, "+"),
        image_type: "photo",
        per_page: 3,
      },
    });

    const hits = response.data?.hits;

    if (!hits?.length) {
      await zeyahIO.reply(<>❌️ Failed to fetch image.</>);
      return;
    }

    const attachments: ZeyahAdapter.DispatchFormStrict["attachments"] = [];

    const chosen = new Set<number>();

    while (attachments.length < 3 && chosen.size < hits.length) {
      const idx = Math.floor(Math.random() * hits.length);

      if (chosen.has(idx)) continue;

      chosen.add(idx);

      const stream = await streamImage(hits[idx].largeImageURL);

      const at: (typeof attachments)[number] = {
        stream,
        name: `image_${attachments.length + 1}.png`,
      };
      attachments.push(at);
    }

    await zeyahIO.unsend(searching);

    await zeyahIO
      .reply(
        <>
          <>Here's the image:</>
        </>,
      )
      .setAttachments(attachments);
  },
});

async function streamImage(url: string): Promise<Stream> {
  const response = await axios.get(url, {
    responseType: "stream",
  });

  return response.data;
}
