export class DateHelper {
  static getBrazilianDateTime(date: Date) {
    const finalDate = date.toLocaleString('pt-BR', { timeZone: 'America/Belem' });
    return finalDate;
  }

  static getBrazilianDate(date: Date) {
    const fullDate = new Date(date).toLocaleString('pt-br', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    });

    return fullDate;
  }

  static getBrazilianTime(date: Date) {
    const parsedDate = this.getBrazilianDateTime(date);
    return parsedDate.split(', ')[1];
  }

  static parseUTCDateInTimeZone(stringDate: string): Date {
    // 03 Sep 2024, 21:20 -> Tue Sep 03 2024 18:20:00 GMT-0300 (Hora padrão de Brasília)
    const utcDate = new Date(stringDate + ' UTC');
    return utcDate;
  }

  static getReadableTimeDateDifference({ date, showStatsFromToday }: { date: Date; showStatsFromToday?: boolean }): string {
    const currentDate = new Date();
    const timeDifference = new Date(date).getTime() - currentDate.getTime();

    const minutesDiff = Math.floor(Math.abs(timeDifference) / (1000 * 60));
    const hoursDiff = Math.floor(Math.abs(timeDifference) / (1000 * 60 * 60));
    const daysDiff = Math.floor(Math.abs(timeDifference) / (1000 * 60 * 60 * 24));
    const label = timeDifference < 0 ? 'há' : 'em';

    if (showStatsFromToday && daysDiff < 1) {
      if (hoursDiff < 1) {
        if (minutesDiff < 1) {
          return 'Agora';
        } else {
          return `${label} ${minutesDiff} ${minutesDiff === 1 ? 'minuto' : 'minutos'}`;
        }
      } else {
        return `${label} ${hoursDiff} ${hoursDiff === 1 ? 'hora' : 'horas'}`;
      }
    }

    if (daysDiff < 1) {
      return 'Hoje';
    } else if (daysDiff < 7) {
      return `${label} ${daysDiff} ${daysDiff === 1 ? 'dia' : 'dias'}`;
    } else if (daysDiff < 30) {
      const weeksDiff = Math.floor(daysDiff / 7);
      return `${label} ${weeksDiff} ${weeksDiff === 1 ? 'semana' : 'semanas'}`;
    } else if (daysDiff < 365) {
      const monthsDiff = Math.floor(daysDiff / 30);
      return `${label} ${monthsDiff} ${monthsDiff === 1 ? 'mês' : 'meses'}`;
    } else {
      const yearsDiff = Math.floor(daysDiff / 365);
      return `${label} ${yearsDiff} ${yearsDiff === 1 ? 'ano' : 'anos'}`;
    }
  }

  static getDateDaysDiff(date1: Date, date2: Date) {
    // Criando novas datas com apenas ano, mês e dia, ignorando as horas
    const d1 = new Date(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate());
    const d2 = new Date(date2.getUTCFullYear(), date2.getUTCMonth(), date2.getUTCDate());

    // Cálculo da diferença em milissegundos
    const diffTime = Math.abs(d2.getTime() - d1.getTime());

    // Cálculo da diferença em dias
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }
}
