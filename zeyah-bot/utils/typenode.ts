export abstract class Type<T = any> {
  abstract check(value: unknown): value is T;
}
export namespace Type {
  export type PrimitiveName =
    | "string"
    | "number"
    | "boolean"
    | "integer"
    | "nan"
    | "null"
    | "undefined";

  export class Primitive<T> extends Type<T> {
    public readonly kind: PrimitiveName;
    constructor(kind: PrimitiveName) {
      super();
      this.kind = kind;
    }

    check(value: unknown): value is T {
      switch (this.kind) {
        case "string":
          return typeof value === "string";

        case "number":
          return typeof value === "number";

        case "boolean":
          return typeof value === "boolean";

        case "integer":
          return typeof value === "number" && Number.isInteger(value);

        case "nan":
          return typeof value === "number" && Number.isNaN(value);

        case "null":
          return value === null;

        case "undefined":
          return value === undefined;
      }

      return false;
    }
  }

  export class Union<T = any> extends Type<T> {
    public readonly children: Type[];
    constructor(children: Type[]) {
      super();
      this.children = children;
    }

    check(value: unknown): value is T {
      for (const node of this.children) {
        if (node.check(value)) return true;
      }
      return false;
    }
  }

  export class ArrayType<T = any> extends Type<T[]> {
    public readonly elementType?: Type<T>;
    public readonly length?: number;
    public readonly tupleTypes?: Type[];
    constructor(elementType?: Type<T>, length?: number, tupleTypes?: Type[]) {
      super();
      this.elementType = elementType;
      this.length = length;
      this.tupleTypes = tupleTypes;
    }

    check(value: unknown): value is T[] {
      if (!Array.isArray(value)) return false;

      if (this.tupleTypes) {
        if (value.length !== this.tupleTypes.length) return false;

        for (let i = 0; i < this.tupleTypes.length; i++) {
          if (!this.tupleTypes[i].check(value[i])) return false;
        }

        return true;
      }

      if (this.length !== undefined && value.length !== this.length)
        return false;

      if (this.elementType) {
        for (let i = 0; i < value.length; i++) {
          if (!this.elementType.check(value[i])) return false;
        }
      }

      return true;
    }
  }

  export class ObjectType extends Type<any> {
    private keys: string[];
    public readonly shape: Record<string, Type>;

    constructor(shape: Record<string, Type>) {
      super();
      this.keys = Object.keys(shape);
      this.shape = shape;
    }

    check(value: unknown): value is any {
      if (typeof value !== "object" || value === null) return false;

      for (const key of this.keys) {
        if (!this.shape[key].check((value as any)[key])) return false;
      }

      return true;
    }
  }

  export class Instance<T> extends Type<T> {
    public readonly cls: new (...args: any[]) => T;
    constructor(cls: new (...args: any[]) => T) {
      super();
      this.cls = cls;
    }

    check(value: unknown): value is T {
      return value instanceof this.cls;
    }
  }

  export class Predicate<T = any> extends Type<T> {
    public readonly fn: (v: unknown) => boolean;
    constructor(fn: (v: unknown) => boolean) {
      super();
      this.fn = fn;
    }

    check(value: unknown): value is T {
      return this.fn(value);
    }
  }

  export const string = new Primitive<string>("string");
  export const number = new Primitive<number>("number");
  export const boolean = new Primitive<boolean>("boolean");
  export const integer = new Primitive<number>("integer");
  export const nan = new Primitive<number>("nan");
  export const nullType = new Primitive<null>("null");
  export const undefinedType = new Primitive<undefined>("undefined");

  export function union<T>(...nodes: Type[]): Union<T> {
    return new Union(nodes);
  }

  export function array<T>(
    element?: Type<T>,
    options?: {
      length?: number;
      tuple?: Type[];
    },
  ): ArrayType<T> {
    if (options?.tuple) {
      return new ArrayType(undefined, undefined, options.tuple);
    }

    return new ArrayType(element, options?.length);
  }

  export function object(shape: Record<string, Type>): ObjectType {
    return new ObjectType(shape);
  }

  export function instance<T>(cls: new (...args: any[]) => T): Instance<T> {
    return new Instance(cls);
  }

  export function where<T>(fn: (v: unknown) => boolean): Predicate<T> {
    return new Predicate(fn);
  }

  export function Validate(...types: Type[]) {
    return function (target: any, context: ClassMethodDecoratorContext) {
      return function (this: any, ...args: any[]) {
        for (let i = 0; i < types.length; i++) {
          if (types[i] && !types[i].check(args[i])) {
            throw new Error(`Validation failed at argument ${i}`);
          }
        }

        return target.apply(this, args);
      };
    };
  }
}
