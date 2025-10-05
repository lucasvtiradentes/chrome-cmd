export class ParserHelper {
  static caseIsEmptyString<T1, T2>(value: T1 | '', defaultValue: T2) {
    return value === '' ? defaultValue : value;
  }

  static caseIsNull<T1, T2>(value: T1 | null, defaultValue: T2) {
    return value === null ? defaultValue : value;
  }
}
