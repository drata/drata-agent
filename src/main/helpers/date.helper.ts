import moment, { unitOfTime } from 'moment';

function timeSinceDate(date: Date, part: unitOfTime.Diff): number {
    // set the time to the local time zone
    const localTime = moment.utc(date).local();
    // set the time to the local time zone
    const curLocalTime = moment.utc().local();
    // return local time from now
    return curLocalTime.diff(localTime, part);
}

function hoursSinceDate(date: Date): number {
    return timeSinceDate(date, 'hours');
}

function minutesSinceDate(date: Date): number {
    return timeSinceDate(date, 'minutes');
}

function currentLocalTime(): string {
    return moment.utc().local().toISOString();
}

export { currentLocalTime, hoursSinceDate, minutesSinceDate };
