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

import { HOME_DIR } from "@zeyah-bot/registry";
import path from "node:path";
import ts from "typescript";
/**
 * **createEvalTsx()** creates a function that can transpile and evaluate TypeScript/JSX code string.
 *
 * *(Jsdoc fully written by jules with help of lianecagara)*
 */
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

/**
 * **evalTsx** is a default instance of the evaluator using the project's root directory.
 */
export const evalTsx = createEvalTsx(HOME_DIR);
