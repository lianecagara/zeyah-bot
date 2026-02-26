import { Bold, Code, Italic, List, ListItem, Text } from "@kayelaa/zeyah";
import {
  AstralHelpOption,
  Breaks,
  Choice,
  Divider,
  Embed,
  EmbedDescription,
  EmbedTitle,
  JoinNode,
  Random,
} from "@zeyah-bot/components";
import { findCommand } from "@zeyah-bot/registry";
import { getCallableCommands, getRoleName } from "@zeyah-bot/registry";

export const Help = module.register({
  emoji: "🧰",

  pluginNames: [],
  name: "help",
  author: ["@lianecagara", "@mrkimstersdev"],
  description: "Your typical help list.",
  version: "2.0.0",
  prefixMode: "optional",
  aliases: ["h", "menu", "guide", "how"],
  async onCommand({ args, zeyahIO, commandName, currentPrefix }) {
    const commands = getCallableCommands().sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    if (args.length === 0) {
      const list = (
        <>
          <JoinNode by={"\n\n"}>
            {commands.map((cmd) => {
              const resolve = findCommand(cmd.name);
              const isNotLatest = resolve !== cmd;
              return (
                <AstralHelpOption
                  commandName={cmd.name}
                  description={cmd.description}
                  emoji={cmd.emoji ?? "📄"}
                  prefix={currentPrefix}
                  optionalVer={isNotLatest ? cmd.version : null}
                />
              );
            })}
          </JoinNode>
        </>
      );
      zeyahIO.reply(
        <>
          <Bold>
            📝{" "}
            <Random>
              <Choice>Help List</Choice>
              <Choice>Command List</Choice>
              <Choice>Available Commands</Choice>
              <Choice>Supported CMDs</Choice>
            </Random>
          </Bold>
          <Divider break />

          {list}
        </>,
      );
    } else {
      const command = findCommand(args.at(0));
      if (!command) {
        zeyahIO.reply(
          <Random>
            <Choice>
              <Bold>⁉️ Command not found.</Bold>
            </Choice>
            <Choice>
              <Bold>❓ I don't know.</Bold>
            </Choice>
            <Choice>
              <Bold>❌ Unidentifiable Input</Bold>
            </Choice>
            <Choice>
              <Bold>🛑 Hmm… can't process that.</Bold>
            </Choice>
            <Choice>
              <Bold>🤷‍♂️ No clue.</Bold>
            </Choice>
            <Choice>
              <Bold>Beats me.</Bold>
            </Choice>
            <Choice>
              <Bold>¯\_(ツ)_/¯</Bold>
            </Choice>
            <Choice>
              <Bold>Maybe try something else?</Bold>
            </Choice>
          </Random>,
        );
        return;
      }
      const normalAuthor = (
        Array.isArray(command.author) ? [...command.author] : [command.author]
      ).filter(Boolean);
      zeyahIO.reply(
        <>
          <Bold>📝 Command Info</Bold>
          <Divider break />
          <List ordered={false}>
            <ListItem>
              <Bold>Name:</Bold>{" "}
              <Text>
                {command.name}@{command.version}
              </Text>
            </ListItem>
            <ListItem>
              <Bold>Aliases:</Bold>{" "}
              <Text>{(command.aliases ?? []).join(", ") || "None"}</Text>
            </ListItem>
            <ListItem>
              <Bold>Description</Bold>{" "}
              <Text>{command.description ?? "Beats me.."}</Text>
            </ListItem>
            <ListItem>
              <Bold>Authors:</Bold>{" "}
              <Text>{normalAuthor.join(", ") || "None"}</Text>
            </ListItem>
            <ListItem>
              <Bold>Prefix Mode:</Bold>{" "}
              <Text>{command.prefixMode ?? "required"}</Text>
            </ListItem>
            <ListItem>
              <Bold>Arguments:</Bold>{" "}
              <Text>{(command.argGuide ?? []).join(" ") || "None"}</Text>
            </ListItem>
            <ListItem>
              <Bold>Role Required:</Bold>{" "}
              <Text>
                {command.role ?? 0} ({getRoleName(command.role ?? 0)})
              </Text>
            </ListItem>
          </List>
        </>,
      );
    }
  },
});
