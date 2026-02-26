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
