import { getContent } from "@zeyah-bot/utils";

export const Catfact = module.register({
  emoji: "😺",
  name: "catfact",
  version: "1.0.0",
  author: ["@lianecagara", "@popcat"],
  pluginNames: [],
  description: "I GIVE YU SUM RANOMIZED FACTS!!",
  WrapperFC({ getChildrenString }) {
    return (
      <Comps.CassFormat
        title="😺 LulCat Wisdom!"
        fbContentFont="fancy"
        fbTitleFont="bold"
      >
        {getChildrenString()}
      </Comps.CassFormat>
    );
  },
  async onCommand({ zeyahIO }) {
    const searching = await zeyahIO.reply(<>🔎 Processing...</>);

    const {
      message: { fact },
    } = await getContent<{ message: { fact: string } }>(
      "https://api.popcat.xyz/v2/fact",
    );

    await zeyahIO.unsend(searching);

    const searching2 = await zeyahIO.reply(<>🔎 Processing (2)...</>);

    const {
      message: { text: catVer },
    } = await getContent<{ message: { text: string } }>(
      "https://api.popcat.xyz/v2/lulcat",
      {
        text: fact,
      },
    );

    await zeyahIO.unsend(searching2);

    await zeyahIO.reply(<>{catVer}</>);
  },
});
