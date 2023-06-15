import moment from 'moment';

export function hoursSinceDate(date: Date): number {
    // set the time to the local time zone
    const localTime = moment.utc(date).local();
    // set the time to the local time zone
    const currentLocalTime = moment.utc().local();
    // return local time from now
    return currentLocalTime.diff(localTime, 'hours');
}
