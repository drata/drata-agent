import { Job } from 'node-schedule';

export type JobSpec = {
    schedule: string;
    title: string;
    action: () => void;
    job?: Job;
};
