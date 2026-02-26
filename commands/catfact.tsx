import Zeyah, { CassFormat, PropsWithInfo } from "@kayelaa/zeyah";
import { getContent } from "@zeyah-bot/utils";

export const Catfact = module.register({
  emoji: "😺",
  name: "catfact",
  version: "1.0.0",
  author: ["@lianecagara", "@popcat"],
  pluginNames: [],
  description: "I GIVE YU SUM RANOMIZED FACTS!!",
  async onCommand({ zeyahIO }) {
    const Format: Zeyah.FC<PropsWithInfo> = ({ getChildrenString }) => {
      return (
        <CassFormat title="😺 Catfact" fbContentFont="fancy" fbTitleFont="bold">
          {getChildrenString()}
        </CassFormat>
      );
    };

    const searching = await zeyahIO.reply(<Format>🔎 Processing...</Format>);

    const {
      message: { fact },
    } = await getContent<{ message: { fact: string } }>(
      "https://api.popcat.xyz/v2/fact",
    );

    await zeyahIO.unsend(searching);

    const searching2 = await zeyahIO.reply(
      <Format>🔎 Processing (2)...</Format>,
    );

    const {
      message: { text: catVer },
    } = await getContent<{ message: { text: string } }>(
      "https://api.popcat.xyz/v2/lulcat",
      {
        text: fact,
      },
    );

    await zeyahIO.unsend(searching2);

    await zeyahIO.reply(<Format>{catVer}</Format>);
  },
});
