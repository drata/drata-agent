import {
    AsyncTask,
    JobStatus,
    SimpleIntervalJob,
    ToadScheduler,
} from 'toad-scheduler';
import { ServiceBase } from '../service-base.service';

export class SchedulerService extends ServiceBase {
    private static readonly scheduler: ToadScheduler = new ToadScheduler();
    static readonly instance: SchedulerService = new SchedulerService();

    private constructor() {
        super();
    }

    scheduleAndRunJob({
        hours,
        id,
        action,
    }: {
        hours: number;
        id: string;
        action: () => Promise<unknown>;
    }): void {
        // may be called on delay need to handle any here
        try {
            if (SchedulerService.scheduler.existsById(id)) {
                const job = SchedulerService.scheduler.getById(id);
                if (job.getStatus() === JobStatus.RUNNING) {
                    this.logger.info(`Job ${id} already running.`); // prevent restarting
                } else {
                    this.logger.info(`Job ${id} already created. Starting...`);
                    job.start();
                }
            } else {
                // actual id for the job is required to register for later use with getAllJobs/getById
                SchedulerService.scheduler.addSimpleIntervalJob(
                    new SimpleIntervalJob(
                        { hours, runImmediately: true },
                        new AsyncTask(id, action, error => {
                            this.logger.error(
                                error,
                                `Failed to run job "${error.message}"`,
                            );
                        }),
                        {
                            id: id,
                            preventOverrun: true,
                        },
                    ),
                );

                this.logger.info(
                    `Scheduled ${id} to run every ${hours} hour(s).`,
                );
            }
        } catch (error: unknown) {
            this.logger.error(
                `Error scheduling job ${id}. Stopping all scheduled tasks...`,
                error instanceof Error ? error.message : String(error),
            );
            this.stopAllJobs();
            throw error;
        }
    }

    getScheduledJobsInfo(): any[] {
        return SchedulerService.scheduler.getAllJobs().map(j => ({
            title: j.id,
            status: j.getStatus(),
        }));
    }

    startAllJobs(): void {
        for (const job of SchedulerService.scheduler.getAllJobs()) {
            // prevent restarting jobs
            if (job.getStatus() === JobStatus.STOPPED) {
                job.start();
                this.logger.info(`Started job ${job.id}.`);
            }
        }
    }

    stopAllJobs(): void {
        SchedulerService.scheduler.stop();
        this.logger.info('Stopped all jobs.');
    }
}
