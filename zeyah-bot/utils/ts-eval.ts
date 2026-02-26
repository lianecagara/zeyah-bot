import { HOME_DIR } from "@zeyah-bot/registry";
import path from "node:path";
import ts from "typescript";
export function createEvalTsx(tsconfigPath: string) {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);

  const parsed = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(tsconfigPath),
  );

  return (code: string) => {
    const output = ts.transpileModule(code, {
      compilerOptions: {
        ...parsed.options,
      },
      fileName: "virtual.tsx",
    }).outputText;

    return Function(output)();
  };
}

export const evalTsx = createEvalTsx(HOME_DIR);
