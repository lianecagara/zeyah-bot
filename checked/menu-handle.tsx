import { AnyZeyahElement, Code } from "@kayelaa/zeyah";
import { definePlugin } from "@zeyah-bot/registry";
import { ZeyahCMD, ZeyahCMDCTX, ZeyahEventCTX } from "@zeyah-bot/types";

export const menuHandlePlugin = definePlugin(async () => ({
  pluginName: "menu-handle",
  pluginDepNames: [],
  defaultConfig: {},
  async onMutateCurrentCommand(configFromCommand, define, mutateCommand, ctx) {
    const initHandlers = () => {
      configFromCommand.init?.(handleFunc);
      for (const key of Reflect.ownKeys(configFromCommand)) {
        if (typeof key !== "string") continue;
        if (!key.startsWith("on_")) continue;
        const name = key.slice("on_".length);
        if (!name) continue;
        handleFunc(`-${name}`, Reflect.get(configFromCommand, key));
      }
    };
    const name = ctx.commandName;
    const [, propName] = name.split("-").map((i) => i.trim());
    let isInitFinish = false;

    const routes: RuntimeRoutes = new Map();
    const handleFunc: HandleFunc = (route, handler) => {
      if (isInitFinish) {
        throw new Error("Cannot add new handle.");
      }
      routes.set(route, handler);
    };
    handleFunc.getListNode = () => {
      const handles = handleFunc.getHandles();
      return (
        <>
          {handles.map((i) => (
            <>
              <Code>
                {ctx.currentPrefix}
                {ctx.commandName}
                {i[0]}
              </Code>
              <br />
            </>
          ))}
        </>
      );
    };
    handleFunc.getHandles = () => {
      return Array.from(routes);
    };
    handleFunc.isApplicable = () => {
      return Boolean(propName);
    };
    handleFunc.end = async () => {
      if (!propName || !name) return;

      for (const [routeString, handle] of routes) {
        const route = extractRouteData(routeString);
        if (!route) continue;
        if (route.prop !== propName) continue;
        isInitFinish = true;
        handle({
          ...ctx,
          handleArgs: ctx.args,
          handleProp: propName,
        });
      }
    };
    initHandlers();
    define("handle", handleFunc);
  },
}));

declare global {
  interface GlobalZeyahPlugins {
    "menu-handle": {
      ctx: {
        handle: HandleFunc;
      };
      config: {
        init?: ConfigInit;
        [key: `on_${string}`]: Handler;
      };
    };
  }
}

export interface ConfigInit {
  (handle: HandleFunc): boolean;
}

export interface RuntimeRoutes extends Map<any, Handler> {}

export interface HandleCtx extends ZeyahCMDCTX {
  handleProp: string;
  handleArgs: string[];
}

export interface Handler {
  (ctx: HandleCtx): any | Promise<any>;
}

export type HandleRouteLiteral = `-${string}`;

export type HandleRouteDataOf<T extends HandleRouteLiteral> =
  T extends `-${infer Prop}`
    ? {
        prop: Prop;
      }
    : never;

export interface HandleFunc {
  <Route extends HandleRouteLiteral>(route: Route, handler: Handler): void;
  end(): Promise<any>;
  isApplicable(): boolean;
  getHandles(): IteratedArray<RuntimeRoutes>;
  getListNode(): AnyZeyahElement;
}

export function extractRouteData<Route extends HandleRouteLiteral>(
  route: Route,
): HandleRouteDataOf<Route> {
  const match = route.match(/^-(.+)$/);

  if (!match) return null;

  return {
    prop: match[1],
  } as HandleRouteDataOf<Route>;
}
