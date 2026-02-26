import { Bold, Choice, Random } from "@zeyah-bot/components";
import { getConfig } from "@zeyah-bot/registry";

export const Goi = module.register({
  emoji: "🤣",
  name: "goi",
  version: "1.0.0",
  author: ["@lianecagara"],
  pluginNames: [],
  description: "Kagaguhan",
  notCommand: true,
  async onMessage({ zeyahIO, message, messageWords, event }) {
    const config = getConfig();
    const admins = [...config.adminBot, ...config.moderatorBot];
    if (Object.keys(event.mentions).some((i) => admins.includes(i))) {
      await zeyahIO.reply(
        <>
          <Random>
            <Choice>
              <Bold>
                Hey, let’s not bring the admins into this… they’re watching.
              </Bold>
            </Choice>
            <Choice>
              <Bold>Careful. You just summoned an admin. I’d avoid that.</Bold>
            </Choice>
            <Choice>
              <Bold>Oops, admin talk detected. Let’s change the subject.</Bold>
            </Choice>
            <Choice>
              <Bold>Admins are shy creatures. Please don’t poke them.</Bold>
            </Choice>
            <Choice>
              <Bold>
                That’s an admin. I have been legally advised to stay quiet now.
              </Bold>
            </Choice>
            <Choice>
              <Bold>
                Alert: Admin entity found. Initiating distraction protocol.
              </Bold>
            </Choice>
            <Choice>
              <Bold>
                Nothing to see here. Move along. Especially away from admin.
              </Bold>
            </Choice>
            <Choice>
              <Bold>Uh oh. Admin name dropped. I choose peace.</Bold>
            </Choice>
          </Random>
        </>,
      );
      return;
    }
  },
});
