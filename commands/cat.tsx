import { getStreamFromUrlFull } from "@zeyah-bot/utils";

export const CouldRead = module.register({
  emoji: "🙀",
  name: "cat",
  version: "1.0.0",
  author: ["@lianecagara", "@cataas.com"],
  pluginNames: [],
  description: "Cat as a Service. Random cats, MEOW.",
  WrapperFC({ getChildrenString }) {
    return (
      <Comps.CassFormat
        title="🐈🎲 Random Cat"
        fbContentFont="fancy"
        fbTitleFont="bold"
      >
        {getChildrenString()}
      </Comps.CassFormat>
    );
  },
  async onCommand({ zeyahIO }) {
    const result = await getStreamFromUrlFull(`https://cataas.com/cat`, {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",

        "accept-encoding": "gzip, deflate, br, zstd",

        "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",

        "cache-control": "max-age=0",

        priority: "u=0, i",

        "sec-ch-ua":
          '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',

        "sec-ch-ua-mobile": "?0",

        "sec-ch-ua-platform": '"Windows"',

        "sec-fetch-dest": "document",

        "sec-fetch-mode": "navigate",

        "sec-fetch-site": "none",

        "sec-fetch-user": "?1",

        "upgrade-insecure-requests": "1",

        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
      },
    });

    await zeyahIO.reply(<>MEOW!</>).setAttachments([
      {
        name: result.pathName,
        stream: result.stream,
      },
    ]);
  },
});
