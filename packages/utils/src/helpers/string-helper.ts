export class StringHelper {
  public static generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  public static minLengthString(message: string, minLength: number) {
    if (message.length < minLength) return message + ' '.repeat(minLength - message.length);
    return message;
  }
}
