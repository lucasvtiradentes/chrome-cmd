export class Masks {
  // INPUT =====================================================================

  static inputToBrlNumber(input: string, configs?: { limitLength?: number }): string {
    const isNegative = input.startsWith('-');
    let onlyNumericString = input.replace(/[^\d]/g, '');

    if (onlyNumericString === '') {
      if (!isNegative) return '';
      onlyNumericString = '0';
    }

    if (isNaN(Number(onlyNumericString))) {
      if (!isNegative) return '';
      onlyNumericString = '0';
    }

    onlyNumericString = onlyNumericString.substring(0, configs?.limitLength ?? 16);
    const numberValue = Number(onlyNumericString) / 100;
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numberValue);

    return isNegative ? `-${formattedValue}` : formattedValue;
  }

  static inputToCurrency(input: string, configs?: { limitLength?: number }) {
    const isNegative = input.startsWith('-');
    let onlyNumericString = input.replace(/[^\d]/g, '');

    if (onlyNumericString === '') {
      if (!isNegative) return '';
      onlyNumericString = '0';
    }

    if (isNaN(Number(onlyNumericString))) {
      if (!isNegative) return '';
      onlyNumericString = '0';
    }

    onlyNumericString = onlyNumericString.substring(0, configs?.limitLength ?? 16);
    const currencyValue = (Number(onlyNumericString) / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

    return isNegative ? `-${currencyValue}` : currencyValue;
  }

  // STRING ====================================================================

  static currencyToNumber(input: string) {
    const currencyValue = input.replace(/[^\d-]/g, '');
    const numericValue = Number(currencyValue) / 100;
    return numericValue;
  }

  static brlNumberToNumber(input: string) {
    const onlyNumericString = input.replace(/[^\d-]/g, '');
    const numberValue = Number(onlyNumericString) / 100;
    return numberValue;
  }

  // NUMBER ====================================================================

  static numberToCurrency(input: number) {
    const currencyValue = input.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return currencyValue;
  }

  static numberToMaskedNumber(input: number) {
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(input);

    return formattedValue;
  }

  static numberToPrecision(number: number, precision: number) {
    return parseFloat(number.toFixed(precision));
  }

  // DATE ======================================================================

  static dateToBrlDate(inputDate: Date) {
    return inputDate.toLocaleString('pt-BR').replace(',', ' -');
  }

  static brlDateToDate(brlDate: string) {
    const [datePart, timePart] = brlDate.split(' - ');
    const [day, month, year] = datePart!.split('/');
    const [hours, minutes, seconds] = timePart!.split(':');
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), Number(seconds));
  }
}
