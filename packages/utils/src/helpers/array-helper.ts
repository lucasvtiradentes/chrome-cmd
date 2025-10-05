export class ArrayHelper {
  static mergeArrayOfArrays = <T>(arr: T[][]): T[] => arr.reduce((acc, val) => acc.concat(val), []);

  static arrayFrom1ToN = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

  static getRandomElement<T>(arr: T[]): T | undefined {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  static groupObjectArrayByKey = <T extends Record<string, unknown>, K extends keyof T>(arr: T[], key: K) => {
    return arr.reduce(
      (acc, item) => {
        const typedKey = item[key] as keyof typeof acc;

        if (!acc[typedKey]) {
          acc[typedKey] = [] as T[];
        }

        acc[typedKey].push(item);

        return acc;
      },
      {} as Record<string, T[]>
    );
  };

  static shuffleArray<T>(arr: T[]): T[] {
    return arr.sort(() => Math.random() - 0.5);
  }

  static getCircularIndex<T>(arr: T[], superIndex: number) {
    const arrayLength = arr.length;

    // Calcula o resto da divisão da diferença de (super index) pelo comprimento do array.
    const divisionRest = superIndex % arrayLength;

    // Adiciona o comprimento do array ao resto para garantir que o índice seja positivo.
    const positiveIndex = divisionRest + arrayLength;

    // Calcula o índice final, garantindo que ele esteja dentro do intervalo do array.
    return positiveIndex % arrayLength;
  }
}
