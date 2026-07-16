const formatter = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
});

export class TimeFormatter {
    static formatTimestamp(date: Date): string {
        return formatter.format(date);
    }
}