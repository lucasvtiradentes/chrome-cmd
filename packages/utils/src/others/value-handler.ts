export class ValueHandler<TFinal> {
  constructor(private _value: unknown) {}

  caseNull<T>(value: T | null) {
    if (this._value === null) this._value = value;
    return this;
  }

  caseUndefined<T>(value: T) {
    if (this._value === undefined) this._value = value;
    return this;
  }

  caseEmptyString<T>(value: T) {
    if (this._value === '') this._value = value;
    return this;
  }

  caseNotNumber<T>(value: T) {
    if (typeof this._value !== 'number' || (typeof this._value === 'number' && isNaN(this._value))) this._value = value;
    return this;
  }

  caseNumber<T>(value: T) {
    if (typeof this._value === 'number' && !isNaN(this._value)) this._value = value;
    return this;
  }

  value() {
    return this._value as TFinal;
  }
}
