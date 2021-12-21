const toSecondsConverterConstant = {
    month: 30 * 24 * 60 * 60,
    day: 24 * 60 * 60,
    hour: 60 * 60,
    minute: 60,
    second: 1,
};
type formats = keyof typeof toSecondsConverterConstant;
export function intervalToDuration(start: number | Date, end: number | Date = Date.now()) {
    const intervalObj = {
        month: 0,
        day: 0,
        hour: 0,
        minute: 0,
        second: 0,
    };
    const startDate = new Date(start).getTime() / 1000;
    const endDate = new Date(end).getTime() / 1000;
    const interval = Math.round(endDate - startDate);
    // Months
    const remainingDays = intervalToFormat(interval, "month", intervalObj);
    // Days
    const remainingHours = intervalToFormat(remainingDays, "day", intervalObj);
    // Hours
    const remainingMinutes = intervalToFormat(remainingHours, "hour", intervalObj);
    // Minutes
    const remainingSeconds = intervalToFormat(remainingMinutes, "minute", intervalObj);
    // Seconds
    intervalToFormat(remainingSeconds, "second", intervalObj);

    return intervalObj;
}
function intervalToFormat(int: number, format: formats, intervalObj: Record<formats, number>): number {
    const value = Math.floor(int / toSecondsConverterConstant[format]);
    const remaining = value === 0 ? int : int - value * toSecondsConverterConstant[format];
    intervalObj[format] = value;
    return remaining;
}
export function intervalObjToStr(int: Record<formats, number> | number | Date) {
    if (typeof int === "number" || int instanceof Date) int = intervalToDuration(int);

    const formatStr = (format: formats) => {
        const amount = int[format];
        return amount ? `${amount} ${format}${amount === 1 ? "" : "s"}` : "";
    };
    return (["month", "day", "hour", "minute", "second"] as formats[]).reduce((acc, format) => {
        const formatted = formatStr(format);
        if (!acc) return formatted;
        return formatted ? acc + ", " + formatted : acc;
    }, "");
}
