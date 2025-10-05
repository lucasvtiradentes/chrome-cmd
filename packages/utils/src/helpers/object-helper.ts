export class ObjectHelper {
  static omitObjectKeys = <T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]) =>
    Object.keys(obj)
      .filter((key) => !keys.includes(key as K))
      .reduce((res, k) => Object.assign(res, { [k]: obj[k] }), {} as Omit<T, K>);

  static pickObjectKeys = <T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]) =>
    keys.reduce((res, k) => Object.assign(res, { [k]: obj[k] }), {} as Pick<T, K>);

  static existNestedProperty<T>(obj: unknown, propPath: string): T | undefined {
    let currentObj = obj;

    if (typeof currentObj !== 'object' || currentObj === null) {
      return undefined;
    }

    for (const prop of propPath.split('.')) {
      if (!currentObj || typeof currentObj !== 'object' || !(prop in currentObj)) return undefined;
      currentObj = currentObj[prop as keyof typeof currentObj];
    }

    return currentObj as T;
  }
}
