/**
 * @license MIT
 * @author lianecagara
 *
 * WARNING:
 * Modify at your own risk. You may or may not tamper with this file,
 * but we are not responsible for any side effects, runtime failures,
 * logic corruption, or anything that goes wrong after modification.
 *
 * Do not distribute repositories containing modified internal files like this one.
 *
 * Official repository source (if applicable):
 * https://github.com/lianecagara/zeyah-bot
 *
 * If this file is not from the repository above, treat it as potentially unsafe.
 */
import { Bold, Italic, Line, List, ListItem } from "@kayelaa/zeyah";
import { Choice, Random } from "@zeyah-bot/components";

const test = (
  <>
    <Random>
      <Choice>Lol</Choice>
      <Choice>Okay</Choice>
      <Choice>Bruh</Choice>
    </Random>
    <br />
    Hello, <Bold>World!</Bold>
    <br />
    <Italic>Helloooo.....</Italic>
    <br />
    <Line />
    <br />
    <Bold>Rules!!!</Bold>
    <br />
    <List ordered boldPrefix>
      {[
        "cute si liane",
        "kayelaa na name ni liane",
        "axera-fca tomorrow",
        "may jsx na",
        "ok madam",
      ].map((i) => (
        <ListItem>{i}</ListItem>
      ))}
    </List>
  </>
);
console.log(test.renderFacebook());
console.log(test.renderDiscord());
export { test };
