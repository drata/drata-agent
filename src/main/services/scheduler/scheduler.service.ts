import { app, powerMonitor } from 'electron';
import { isNil, random } from 'lodash';
import nodeSchedule, { Job } from 'node-schedule';
import { JobSpec } from '../../../types/job-spec.type';
import { ServiceBase } from '../service-base.service';

/**
 * The intention of this type is to fail any parameter passed to
 * scheduleJob that doesn't come from AbstractSchedulerService.schedule
 * It can be easily circumvented by casting any string to Schedule ('' as Schedule)
 */
type Schedule = '* * * * * *';

export class SchedulerService extends ServiceBase {
    static readonly instance: SchedulerService = new SchedulerService();

    private jobsSpecs: JobSpec[] = [];

    private constructor() {
        super();

        app.on('before-quit', this.onBeforeQuting.bind(this));
        powerMonitor.on('suspend', this.onSuspend.bind(this));
        powerMonitor.on('resume', this.onResume.bind(this));
    }

    scheduleJob(schedule: Schedule, title: string, action: () => void): Job {
        const job = nodeSchedule.scheduleJob(title, schedule, action);

        if (isNil(job)) {
            throw new Error('Unable to schedule action.');
        }

        job.on('error', error => {
            this.logger.error(error, `Failed to run job "${title}"`);
        });

        this.jobsSpecs.push({
            schedule,
            title,
            action,
            job,
        });

        this.logger.info(`Scheduled "${title}" (${schedule})`);

        return job;
    }

    getScheduledJobsInfo(): any[] {
        return this.jobsSpecs.map(({ title, schedule }) => ({
            title,
            schedule,
        }));
    }

    private cancelJobSpec(spec: JobSpec) {
        // ensure no events will be fired before destroyed
        spec.job?.removeAllListeners();
        // actually cancel Job
        spec.job?.cancel();
        // ensure it will be garbage collected
        delete spec.job;
    }

    private onBeforeQuting(): void {
        this.jobsSpecs.forEach(this.cancelJobSpec);

        this.logger.info(
            `Canceled ${this.jobsSpecs.length} ${
                this.jobsSpecs.length === 1 ? 'job' : 'jobs'
            } to quit the app.`,
        );
    }

    private onSuspend(): void {
        this.jobsSpecs.forEach(this.cancelJobSpec);

        this.logger.info(
            `Canceled ${this.jobsSpecs.length} ${
                this.jobsSpecs.length === 1 ? 'job' : 'jobs'
            } to suspend the system.`,
        );
    }

    private onResume(): void {
        this.jobsSpecs.forEach(this.cancelJobSpec);

        const clonedJobSpecs = this.jobsSpecs.slice();
        this.jobsSpecs = [];

        /**
         * Re cheduling Jobs will re-populate this.jobsSpecs
         */
        clonedJobSpecs.forEach(spec => {
            this.scheduleJob(
                spec.schedule as Schedule,
                spec.title,
                spec.action,
            );
        });

        this.logger.info(
            `Rescheduled ${this.jobsSpecs.length} ${
                this.jobsSpecs.length === 1 ? 'job' : 'jobs'
            } after resuming the system.`,
        );
    }

    /**
     *   Crontab schedule schema
     *   *    *    *    *    *    *
     *   ┬    ┬    ┬    ┬    ┬    ┬
     *   │    │    │    │    │    │
     *   │    │    │    │    │    └─── day of week (0 - 7) (0 or 7 is Sun)
     *   │    │    │    │    └──────── month (1 - 12)
     *   │    │    │    └───────────── day of month (1 - 31)
     *   │    │    └────────────────── hour (0 - 23)
     *   │    └─────────────────────── minute (0 - 59)
     *   └──────────────────────────── second (0 - 59, OPTIONAL)
     */

    static schedule = {
        EVERY_10_SECONDS: '*/10 * * * * *' as Schedule,
        EVERY_30_SECONDS: '*/30 * * * * *' as Schedule,
        EVERY_5_MINUTES: '*/5 * * * *' as Schedule,
        EVERY_HOUR: '0 */1 * * *' as Schedule,
        EVERY_2_HOURS: '0 */2 * * *' as Schedule,
        EVERY_6_HOURS: '0 */6 * * *' as Schedule,
        seconds(schedule: number): Schedule {
            if (schedule < 1 && schedule > 60) {
                throw new RangeError(
                    `Invalid value ${schedule}. "schedule" param has to be an integer between 1 and 60.`,
                );
            }
            return `*/${parseInt(
                schedule.toString(),
            )} * * * * *` as unknown as Schedule;
        },
        minutes(schedule: number): Schedule {
            if (schedule < 1 && schedule > 60) {
                throw new RangeError(
                    `Invalid value ${schedule}. "schedule" param has to be an integer between 1 and 60.`,
                );
            }
            return `*/${parseInt(
                schedule.toString(),
            )} * * * *` as unknown as Schedule;
        },
        hours(schedule: number): Schedule {
            if (schedule < 1 && schedule > 24) {
                throw new RangeError(
                    `Invalid value ${schedule}. "schedule" param has to be an integer between 1 and 24.`,
                );
            }
            return `0 */${parseInt(
                schedule.toString(),
            )} * * *` as unknown as Schedule;
        },
        randomizeMinute(schedule: Schedule): Schedule {
            if (schedule.split(' ').length > 5) {
                throw new Error(
                    'Schedule not supported. Only schedules without seconds are allowed.',
                );
            }

            const [, hour, dayMonth, month, dayWeek] = schedule.split(' ');

            const randomMinute = random(0, 59);

            return [randomMinute, hour, dayMonth, month, dayWeek].join(
                ' ',
            ) as Schedule;
        },
    };
}
