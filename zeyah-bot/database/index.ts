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

import { logger } from "@zeyah-utils/logger";
import { KeyValueModelType, ZeyahDB, ZeyahModel } from "./zeyah-db";
export const dbModel = new ZeyahModel("zeyah-db", {
  collection: "zeyah-users-db",
});
import { Decimal } from "decimal.js";

export class UserDB extends ZeyahDB<UserDBProps> {
  constructor(namespace: string, model: KeyValueModelType) {
    super(namespace, model);
  }

  async getPoints(): Promise<Decimal> {
    const result = (await this.get("decimalJSPoints")) ?? "0";
    return new Decimal(result);
  }

  async setPoints(decimal: Decimal): Promise<void> {
    if (decimal instanceof Decimal) {
      await this.set("decimalJSPoints", decimal.toString());
    } else {
      throw new Error("Cannot set a non Decimal() money.");
    }
  }

  async getUsername(
    adapterType: keyof typeof AdapterInstanceRegistry,
  ): Promise<string> {
    try {
      const adapter = AdapterInstanceRegistry[adapterType] ?? null;
      if (!adapter) {
        throw new Error("Invalid Adapter.");
      }
      const usernames = (await this.get("usernames")) ?? {};
      if (typeof usernames[adapterType] === "string") {
        return usernames[adapterType];
      }
      const result = await adapter.onResolveUsername(this.key);
      usernames[adapterType] = result;
      await this.set("usernames", usernames);
      return result;
    } catch (error) {
      return "[Unknown User]";
    }
  }

  async getInventory(
    specialKey: UserDBPropsKeys<InventoryItem[]> = "inventory",
  ) {
    const inv = (await this.get(specialKey)) ?? [];
    return new Inventory(inv);
  }
  async setInventory(
    instance: Inventory,
    specialKey: UserDBPropsKeys<InventoryItem[]> = "inventory",
  ) {
    const raw = Array.from(instance);
    await this.set(specialKey, raw);
  }
}

export class UsersDB extends ZeyahDB<UsersDBProps> {
  constructor(namespace: string, model: KeyValueModelType) {
    super(namespace, model);
  }

  getUser(id: string): UserDB {
    return this.createFromClass(id, UserDB);
  }

  async getAllUsers(): Promise<Map<string, UserDB>> {
    const keys = await this.keysSelf();
    const map = new Map<string, UserDB>();
    for (const key of keys) {
      map.set(key, this.getUser(key));
    }
    return map;
  }
}

export const usersDB = dbModel.createDBWithClass("users", UsersDB);

export interface UserDBProps extends GlobalUserDBProps {
  gameName?: string;
  decimalJSPoints?: string;
  // dummies are required so methods wont fail.
  dummyNumber?: number;
  dummyMap?: MutableEntriesLike<any, any>;
  usernames?: {
    [K in keyof typeof AdapterInstanceRegistry]?: string;
  };
  inventory: InventoryItem[];
}

export type UserDBPropsKeys<Value = any> = FilterKeysByValue<
  UserDBProps,
  Value
>;

export type UsersDBProps = Record<string, UserDBProps>;
import "dotenv/config";
import mongoose from "mongoose";
import { FilterKeysByValue, MutableEntriesLike } from "@zeyah-bot/types";
import { AdapterInstanceRegistry } from "@zeyah-bot/registry";
import { ZeyahAdapter } from "@zeyah-bot/adapters/base";
import { Inventory, InventoryItem } from "@zeyah-utils/inventory";

export async function connect() {
  logger.loader("Connecting to Mongo....");
  const uri = process.env.MONGO_URI ?? null;
  if (!uri) {
    logger.warn(
      "MongoDB will be skipped, the process.env.MONGO_URI is missing! Some DB Functions will not work!",
      "Mongo",
    );
    return;
  }
  await mongoose.connect(uri);
  logger.log("MongoDB Connection Established.", "Info");
}
