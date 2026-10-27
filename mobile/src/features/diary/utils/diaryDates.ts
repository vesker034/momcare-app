export const weekdayShort = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const monthNamesRu = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

export function toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function startOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
}

export function startOfMonth(date: Date): Date {
    const copy = startOfDay(date);
    copy.setDate(1);
    return copy;
}

export function endOfMonth(date: Date): Date {
    const copy = startOfMonth(date);
    copy.setMonth(copy.getMonth() + 1);
    copy.setDate(0);
    return copy;
}

export function addMonths(date: Date, months: number): Date {
    const copy = new Date(date);
    copy.setMonth(copy.getMonth() + months);
    return copy;
}

export function addDays(date: Date, days: number): Date {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
}

export function getMonthMatrix(monthDate: Date): Date[] {
    const first = startOfMonth(monthDate);
    const firstWeekday = (first.getDay() + 6) % 7;
    const gridStart = addDays(first, -firstWeekday);

    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

export function isSameMonth(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function formatMonthTitle(date: Date): string {
    return `${monthNamesRu[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatFullDate(date: Date): string {
    return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);
}
