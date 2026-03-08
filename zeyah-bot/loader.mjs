import { readFileSync } from "node:fs";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { v4 } from "uuid";
/**
 *
 * @type {import("node:module").LoadHook}
 */
export const load = async (url, context, nextLoad) => {
  const result = await nextLoad(url, context);

  if (!result.source || typeof result.source !== "string") {
    return result;
  }

  const instanceId = v4();
  const symbolName_ = `zm_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const dirnameInit = `import { Module as ${symbolName_} } from "module";var __filename = ${JSON.stringify(fileURLToPath(url))}; var __dirname = ${JSON.stringify(dirname(fileURLToPath(url)))}; var module = new ${symbolName_}(${JSON.stringify(instanceId)});module.filename=__filename;;`;

  const src = dirnameInit + result.source;

  return {
    ...result,
    source: src,
  };
};
