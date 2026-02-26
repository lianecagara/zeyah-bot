import path from "path";
import url from "url";
import fs from "fs";
import Module, { createRequire } from "module";

export interface ZeyahImportMetaBase {}

/**
 * Create a pseudo-import.meta object for TS modules (CJS or ESM)
 */
export class ZeyahImportMeta implements ImportMeta, ZeyahImportMetaBase {
  constructor(mod: Module) {
    let filename: string;

    if ("filename" in mod && typeof mod.filename === "string") {
      filename = mod.filename;
    } else if ("url" in mod && typeof mod.url === "string") {
      filename = url.fileURLToPath(mod.url);
    } else {
      throw new Error("Invalid module object passed to createImportMeta");
    }

    const dirname = path.dirname(filename);
    const moduleURL = url.pathToFileURL(filename).href;

    this.dirname = dirname;
    this.filename = filename;
    this.url = moduleURL;
    this.main = mod === require.main;
    this.module = mod;
  }
  module: Module;
  dirname: string;
  filename: string;
  main: boolean;
  url: string;
  resolve(specifier: string, parent: string | URL) {
    let basedir: string;

    if (parent) {
      basedir =
        parent instanceof URL
          ? path.dirname(url.fileURLToPath(parent))
          : path.dirname(parent);
    } else {
      basedir = this.dirname;
    }

    try {
      return require.resolve(specifier, { paths: [basedir] });
    } catch (err) {
      throw new Error(
        `Cannot resolve module '${specifier}' from '${basedir}': ${err}`,
      );
    }
  }
}

Object.defineProperty(Module.prototype, "meta", {
  configurable: false,
  enumerable: false,
  get(this: Module) {
    if (!Reflect.has(this, "__zeyahMeta")) {
      Reflect.set(this, "__zeyahMeta", new ZeyahImportMeta(this));
    }
    return Reflect.get(this, "__zeyahMeta") as ZeyahImportMeta;
  },
});

export class ZeyahModuleHub {
  module: Module;

  constructor(mod: Module) {
    this.module = mod;
  }

  /** Require a module relative to this module */
  require<T = any>(specifier: string) {
    const r = createRequire(this.module.filename);
    return r(specifier) as T;
  }

  /** Dynamic import for ESM */
  async import<T = any>(specifier: string) {
    return import(specifier) as Promise<T>;
  }

  /** Reload module from cache */
  reload() {
    delete require.cache[this.module.filename];
    return require(this.module.filename);
  }

  /** Per-module state store */
  state: Record<string, unknown> = {};

  setState(key: string, value: unknown) {
    this.state[key] = value;
  }

  getState<T = unknown>(key: string): T | undefined {
    return this.state[key] as T;
  }

  /** Utility: resolve a specifier relative to module */
  resolve(specifier: string) {
    return require.resolve(specifier, {
      paths: [path.dirname(this.module.filename)],
    });
  }

  /** Simple logger attached to module */
  log(...args: any[]) {
    console.log(`[${path.basename(this.module.filename)}]`, ...args);
  }
}

import * as registry from "@zeyah-bot/registry";

Object.defineProperty(Module.prototype, "hub", {
  configurable: false,
  enumerable: false,
  get(this: Module) {
    if (!Reflect.has(this, "__zeyahHub")) {
      Reflect.set(this, "__zeyahHub", new ZeyahModuleHub(this));
    }
    return Reflect.get(this, "__zeyahHub") as ZeyahModuleHub;
  },
});
Object.defineProperty(Module.prototype, "register", {
  configurable: false,
  enumerable: false,
  get(this: Module) {
    return registry.register;
  },
});
Object.defineProperty(Module.prototype, "registry", {
  configurable: false,
  enumerable: false,
  get(this: Module) {
    return registry;
  },
});
