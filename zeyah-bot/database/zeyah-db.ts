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

import { FilterKeysByValue, MutableEntriesLike } from "@zeyah-bot/types";
import Decimal from "decimal.js";
import mongoose, { QueryFilter } from "mongoose";

export type PropMap = Record<string, any>;

export interface DBConfig {
  debug?: boolean;
}

export class ZeyahDB<T extends PropMap = never> {
  private namespace: string;
  private model: KeyValueModelType;
  private config: DBConfig;

  constructor(namespace: string, model: any, config: DBConfig = {}) {
    this.namespace = namespace || "";
    this.model = model;
    this.config = config;
  }

  get key() {
    return this.getFinalPath();
  }

  /* -----------------------------
        Internal Key Resolver
    ----------------------------- */

  private getRootNamespace(): string {
    return this.namespace.split(".")[0];
  }

  private getInnerPath(): string {
    const parts = this.namespace.split(".");
    return parts.slice(1).join(".");
  }

  private getFinalPath(): string {
    return this.namespace.split(".").at(-1) ?? "";
  }

  private assertNoDotKey(key: string) {
    if (key.includes(".")) {
      throw new Error("Document key cannot contain '.'");
    }
  }

  /* -----------------------------
        Read Methods
    ----------------------------- */

  async getSelf(): Promise<T | undefined> {
    const rootKey = this.getRootNamespace();
    const pathPrefix = this.getInnerPath();

    const fieldPath = pathPrefix ? `value.${pathPrefix}` : "value";

    const doc = await this.model
      .findOne({ key: rootKey }, { [fieldPath]: 1, _id: 0 })
      .lean();

    if (!doc) return undefined;

    return pathPrefix
      ? pathPrefix.split(".").reduce((obj, k) => obj?.[k], doc.value)
      : doc.value;
  }

  async keysSelf(): Promise<string[]> {
    const pathPrefix = this.getInnerPath();

    const fieldPath = pathPrefix ? `value.${pathPrefix}` : "value";

    const doc = await this.model
      .findOne({ key: this.getRootNamespace() }, { [fieldPath]: 1, _id: 0 })
      .lean();

    if (!doc?.value) return [];

    const base = pathPrefix
      ? pathPrefix.split(".").reduce((obj, k) => obj?.[k], doc.value)
      : doc.value;

    if (!base || typeof base !== "object") return [];

    return Object.keys(base);
  }

  async get<K extends keyof T>(key: K): Promise<T[K] | undefined> {
    const rootKey = this.getRootNamespace();
    const pathPrefix = this.getInnerPath();

    const fieldPath = pathPrefix
      ? `value.${pathPrefix}.${String(key)}`
      : `value.${String(key)}`;

    const doc = await this.model
      .findOne({ key: rootKey }, { [fieldPath]: 1, _id: 0 })
      .lean();

    if (!doc?.value) return undefined;

    const fullPath = pathPrefix
      ? pathPrefix.split(".").concat(String(key).split("."))
      : [String(key)];

    return fullPath.reduce((obj, k) => obj?.[k], doc.value);
  }

  /* -----------------------------
        Write Methods
    ----------------------------- */

  async setSelf(value: T): Promise<void> {
    const pathPrefix = this.getInnerPath();
    const updateObject: QueryFilter<{ key: string; value: T }> = {};

    for (const [k, v] of Object.entries(value as any)) {
      const fullPath = pathPrefix ? `value.${pathPrefix}.${k}` : `value.${k}`;
      Reflect.set(updateObject, fullPath, v);
    }

    await this.model.updateOne(
      { key: this.getRootNamespace() },
      { $set: updateObject },
      { upsert: true },
    );
  }
  async set<K extends keyof T>(key: K, value: T[K]): Promise<void> {
    const rootKey = this.getRootNamespace();

    const pathPrefix = this.getInnerPath();

    const updateObject: Record<string, any> = {};

    const fieldPath = pathPrefix
      ? `value.${pathPrefix}.${String(key)}`
      : `value.${String(key)}`;

    updateObject[fieldPath] = value;

    await this.model.updateOne(
      { key: rootKey },
      { $set: updateObject },
      { upsert: true },
    );
  }



  async replaceProps<K extends keyof T>(
    key: K,
    value: Partial<T[K]>,
  ): Promise<void> {
    const rootKey = this.getRootNamespace();

    const pathPrefix = this.getInnerPath();

    const updateObject: Record<string, any> = {};

    for (const [prop, val] of Object.entries(value as object)) {
      const fieldPath = pathPrefix
        ? `value.${pathPrefix}.${String(key)}.${prop}`
        : `value.${String(key)}.${prop}`;

      updateObject[fieldPath] = val;
    }

    await this.model.updateOne(
      { key: rootKey },
      { $set: updateObject },
      { upsert: true },
    );
  }

  async replacePropsSelf(value: Partial<T>): Promise<void> {
    const rootKey = this.getRootNamespace();

    const pathPrefix = this.getInnerPath();

    const updateObject: Record<string, any> = {};

    for (const [prop, val] of Object.entries(value as object)) {
      const fieldPath = pathPrefix
        ? `value.${pathPrefix}.${prop}`
        : `value.${prop}`;

      updateObject[fieldPath] = val;
    }

    await this.model.updateOne(
      { key: rootKey },
      { $set: updateObject },
      { upsert: true },
    );
  }

  async querySelectSelf(
    query: QueryFilter<{ key: string; value: T[keyof T] }>,
    select: Array<keyof T[keyof T]> | null = null,
  ): Promise<Record<string, T[keyof T]>> {
    const rootKey = this.getRootNamespace();
    const pathPrefix = this.getInnerPath();

    const projection: string = select
      ? select
          .map((p) => `value.${pathPrefix ? pathPrefix + "." : ""}${String(p)}`)
          .join(" ")
      : "value";

    const finalQuery: any = {
      key: rootKey,
      ...this.remapQuery(query),
    };
    // console.log(finalQuery, { pathPrefix, rootKey });

    const docs = await this.model
      .find(finalQuery)
      .select(projection)
      .lean()
      .exec();

    return Object.fromEntries(
      docs.map((doc) => {
        const cleanKey = doc.key;

        return [cleanKey, doc.value];
      }),
    );
  }

  private remapQuery(query: Record<string, any>): Record<string, any> {
    const pathPrefix = this.getInnerPath();
    const remapped: Record<string, any> = {};

    for (const [k, v] of Object.entries(query)) {
      if (k.startsWith("$")) continue;
      const cleanKey = k.startsWith("value.") ? k.slice("value.".length) : k;
      const fieldPath = pathPrefix
        ? `value.${pathPrefix}.${cleanKey}`
        : `value.${cleanKey}`;
      // console.log({ cleanKey, fieldPath, pathPrefix });

      remapped[fieldPath] = v;
    }

    return remapped;
  }

  async isPrimitive(): Promise<boolean> {
    const rootKey = this.getRootNamespace();
    const pathPrefix = this.getInnerPath();

    const fieldPath = pathPrefix ? `value.${pathPrefix}` : "value";

    const doc = await this.model.findOne(
      { key: rootKey },
      { [fieldPath]: 1, _id: 0 },
    );

    if (!doc) return false;

    const target = pathPrefix
      ? pathPrefix.split(".").reduce((obj, k) => obj?.[k], doc.value)
      : doc.value;

    return target === null || typeof target !== "object";
  }

  create<K extends string>(
    key: K,
  ): ZeyahDB<T extends Record<K, infer U> ? U : any> {
    const nextNamespace = this.namespace ? `${this.namespace}.${key}` : key;

    return new ZeyahDB<any>(nextNamespace, this.model, this.config);
  }

  createFromClass<
    K extends string,
    DBClass extends new (namespace: string, model: KeyValueModelType) => any,
  >(key: K, DBClass: DBClass): InstanceType<DBClass> {
    const nextNamespace = this.namespace ? `${this.namespace}.${key}` : key;

    return new DBClass(nextNamespace, this.model);
  }

  async getDecimal<K extends FilterKeysByValue<T, string>>(
    key: K,
  ): Promise<Decimal> {
    const value = (await this.get(key)) ?? "0";
    return new Decimal(value);
  }

  async setDecimal<K extends FilterKeysByValue<T, string>>(
    key: K,
    value: Decimal,
  ) {
    await this.set(key, value.toString() as any);
  }

  async getString<K extends FilterKeysByValue<T, string>>(
    key: K,
  ): Promise<string> {
    const value = this.get(key) ?? "";
    return `${value}`;
  }
  async setString<K extends FilterKeysByValue<T, string>>(
    key: K,
    value: string,
  ) {
    await this.set(key, `${value}` as any);
  }
  async getNumber<K extends FilterKeysByValue<T, number>>(
    key: K,
  ): Promise<number> {
    const value = this.get(key) ?? 0;
    return Number(value);
  }
  async setNumber<K extends FilterKeysByValue<T, number>>(
    key: K,
    value: number,
  ) {
    if (isNaN(value)) {
      throw new Error("Cannot set a NaN.");
    }
    await this.set(key, Number(value) as any);
  }

  async getDate<K extends FilterKeysByValue<T, number>>(key: K) {
    const raw = await this.get(key);
    return new Date(raw ?? 0);
  }

  async setDate<K extends FilterKeysByValue<T, number>>(key: K, value: Date) {
    await this.set(key, value.getTime() as any);
  }

  async getMap<K extends FilterKeysByValue<T, MutableEntriesLike<any, any>>>(
    key: K,
  ): Promise<Map<any, any>> {
    const raw: any = (await this.get(key)) ?? [];
    return new Map(raw as MutableEntriesLike<any, any>);
  }

  async setMap<K extends FilterKeysByValue<T, MutableEntriesLike<any, any>>>(
    key: K,
    value: Map<any, any> | MutableEntriesLike<any, any>,
  ) {
    const normalized =
      value instanceof Map ? Array.from(value.entries()) : value;

    await this.set(key, normalized as any);
  }
}

export const KeyValueSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {},
);

export type KeyValueModelType = mongoose.Model<
  {
    key: string;
    value: any;
  },
  {},
  {},
  {
    id: string;
  },
  mongoose.Document<
    unknown,
    {},
    {
      key: string;
      value: any;
    },
    {
      id: string;
    },
    {
      strict: true;
    }
  > &
    Omit<
      {
        key: string;
        value: any;
      } & {
        _id: mongoose.Types.ObjectId;
      } & {
        __v: number;
      },
      "id"
    > & {
      id: string;
    },
  mongoose.Schema<
    any,
    mongoose.Model<any, any, any, any, any, any, any>,
    {},
    {},
    {},
    {},
    {
      strict: true;
    },
    {
      key: string;
      value: any;
    },
    mongoose.Document<
      unknown,
      {},
      {
        key: string;
        value: any;
      },
      {
        id: string;
      },
      mongoose.ResolveSchemaOptions<{
        strict: true;
      }>
    > &
      Omit<
        {
          key: string;
          value: any;
        } & {
          _id: mongoose.Types.ObjectId;
        } & {
          __v: number;
        },
        "id"
      > & {
        id: string;
      },
    | {
        [path: string]: mongoose.SchemaDefinitionProperty<undefined, any, any>;
      }
    | {
        [x: string]: mongoose.SchemaDefinitionProperty<
          any,
          any,
          mongoose.Document<
            unknown,
            {},
            {
              key: string;
              value: any;
            },
            {
              id: string;
            },
            mongoose.ResolveSchemaOptions<{
              strict: true;
            }>
          > &
            Omit<
              {
                key: string;
                value: any;
              } & {
                _id: mongoose.Types.ObjectId;
              } & {
                __v: number;
              },
              "id"
            > & {
              id: string;
            }
        >;
      },
    {
      key: string;
      value: any;
    } & {
      _id: mongoose.Types.ObjectId;
    } & {
      __v: number;
    }
  >,
  {
    key: string;
    value: any;
  } & {
    _id: mongoose.Types.ObjectId;
  } & {
    __v: number;
  }
>;

export class ZeyahModel {
  model: KeyValueModelType;

  constructor(name: string, options: { collection: string }) {
    const { collection } = options;

    this.model = mongoose.model(name, KeyValueSchema, collection);
  }

  createDB<T extends PropMap>(namespace: string): ZeyahDB<T> {
    return new ZeyahDB<T>(namespace, this.model);
  }
  createDBWithClass<
    DBClass extends new (namespace: string, model: KeyValueModelType) => any,
  >(namespace: string, DBClass: DBClass): InstanceType<DBClass> {
    return new DBClass(namespace, this.model);
  }

  getModel() {
    return this.model;
  }
}
