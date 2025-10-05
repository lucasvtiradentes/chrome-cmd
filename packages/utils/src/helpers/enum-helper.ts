export class EnumHelper {
  static createObjectEnum<T extends string>(arr: readonly [...T[]]) {
    return arr.reduce((obj, item) => ((obj[item] = item), obj), {} as { [K in T]: K });
  }
}

export type ExtractEnumValues<T extends Record<string, unknown>> = T[keyof T];
