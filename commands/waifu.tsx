import Zeyah, { CassFormat, PropsWithInfo } from "@kayelaa/zeyah";
import { getContent, getStreamFromUrlFull } from "@zeyah-bot/utils";

export const CouldRead = module.register({
  emoji: "💝",
  name: "waifu",
  version: "1.0.0",
  author: ["@lianecagara", "@api.waifu.pics"],
  pluginNames: [],
  description: "Neko Waifu Pics! (For gooners.)",
  async onCommand({ zeyahIO, args }) {
    const Format: Zeyah.FC<PropsWithInfo> = ({ getChildrenString }) => {
      return (
        <CassFormat title="💝🎲 Waifu" fbContentFont="fancy" fbTitleFont="bold">
          {getChildrenString()}
        </CassFormat>
      );
    };

    const searching = await zeyahIO.reply(<Format>🔎 Processing...</Format>);

    const { url } = await getContent<{ url: string }>(
      "https://api.waifu.pics/sfw/neko",
    );

    const result = await getStreamFromUrlFull(url, {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",

        "accept-encoding": "gzip, deflate",

        "accept-language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",

        "cache-control": "max-age=0",

        "if-modified-since": "Mon, 27 Apr 2020 23:17:20 GMT",

        "if-none-match": '"2962ea996bc8acd353213cb4eb681a37"',

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

    await zeyahIO.unsend(searching);

    await zeyahIO
      .reply(
        <>
          <Format>Category: Neko</Format>
        </>,
      )
      .setAttachments([
        {
          name: result.pathName,
          stream: result.stream,
        },
      ]);
  },
});
