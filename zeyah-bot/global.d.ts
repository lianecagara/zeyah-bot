declare namespace NodeJS {
  interface Module {
    /**
     * **HELL NO**
     * ===
     * What is wrong with you bro.
     *
     * Use export/import because this is typescript for CJS.
     *
     * All of your import statements will get converted to cjs internally anyway.
     *
     * You can freely use require but for .cache only, or other methods like resolve.
     *
     * (Ignore this ==>)
     * @deprecated
     */
    exports: any;
    mirai: import("@zeyah-bot/legacy/catch-mirai").MiraiModule;
    meta: import("@zeyah-bot/domain/module").ZeyahImportMeta;
    hub: import("@zeyah-bot/domain/module").ZeyahModuleHub;
    register: typeof import("@zeyah-bot/registry").register;
    registry: typeof import("@zeyah-bot/registry");
    exportAsMirai(): void;
  }
}

interface GlobalZeyahPlugins {
  // [pluginName: string]: import("@zeyah-bot/types").PluginContract;
}

type Iterated<M> = M extends Iterable<infer T> ? T : never;
type IteratedArray<T> = T extends Iterable<infer U> ? U[] : never;
interface GlobalUserDBProps {}

type Exhaustive<T extends never> = T;

type MiraiModule = import("@zeyah-bot/legacy/catch-mirai").MiraiModule;
