import { definePlugin, getPluginConfig } from "@zeyah-bot/registry";

export const sixSevenPlugin = definePlugin(async () => ({
  pluginName: "six-seven",
  pluginDepNames: [],
  defaultConfig: {
    enabled: true,
  },
  async onBeforeHandlers(define, _ctx) {
    const config = getPluginConfig("six-seven");
    define("sixSeven", config.enabled ? 67 : 69);
  },
}));

declare global {
  interface GlobalZeyahPlugins {
    "six-seven": {
      ctx: {
        sixSeven: 67 | 69;
      };
      config: {
        enabled: boolean;
      };
    };
  }
}
