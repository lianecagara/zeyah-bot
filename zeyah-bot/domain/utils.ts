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

let x;
export function parseArgsOld(message: string) {
  const [commandName, ...args] = message.trim().split(/\s+/).filter(Boolean);
  return { commandName, args };
}

export function parseArgTokens(body: string): string[] {
  const tokens: string[] = [];
  let i = 0;

  while (i < body.length) {
    while (i < body.length && body[i] === " ") i++;
    if (i >= body.length) break;

    const char = body[i];

    if (char === '"') {
      const start = i;
      i++;
      let escaped = false;

      while (i < body.length) {
        const c = body[i];

        if (!escaped && c === '"') break;

        if (c === "\\" && !escaped) {
          escaped = true;
        } else {
          escaped = false;
        }

        i++;
      }

      if (i >= body.length) {
        const stripped = body.slice(start + 1);
        tokens.push(stripped);
        break;
      }

      const raw = body.slice(start, i + 1);

      let parsed: string;

      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = raw.slice(1, -1);
      }

      tokens.push(parsed);
      i++;
      continue;
    }

    const start = i;
    while (i < body.length && body[i] !== " ") {
      i++;
    }

    tokens.push(body.slice(start, i));
  }

  return tokens;
}
