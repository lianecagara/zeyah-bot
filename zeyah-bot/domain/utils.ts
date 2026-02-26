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
