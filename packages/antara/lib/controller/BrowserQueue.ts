import * as q from 'queue';
import pup from 'puppeteer';
import { v4 as uuid } from 'uuid';
import EventEmitter from 'events';
import { StageRenderConfig } from 'global';

export type CompletionCallback = (j?: Job) => {};
export type ErrorCallback = (err: Error | undefined) => {};


export interface JobConfig {
    jobId: string;
    config: StageRenderConfig;
    isRunning: boolean;
}

export enum JobStatus {
    RUNNING = "RUNNING",
    NOT_STARTED = "STARTED",
    ERROR = "ERROR",
    NOT_FOUND = "NOT_FOUND"
}

export interface ResultConfig {
    screenshot: Buffer;
}

export interface Job {
    id: string;
    isRunning: boolean;
    complete: Promise<JobConfig & ResultConfig>;
}

export class BrowserQueue {
    private _jobMap: WeakMap<object, JobWorker> = new WeakMap();
    public static readonly numJobs: number = 2;
    private _queue: q.default;
    constructor(private shouldRunHeadless: boolean, private completionCallback: CompletionCallback, private errorCallback?: ErrorCallback) {
        this._queue = new q({ autostart: true, concurrency: BrowserQueue.numJobs, timeout: 15 * 60 * 60 });
        process.on("beforeExit", () => {
            this._queue.end();
        })
        this._queue.on("success", (result, job) => {
            console.log("Job success");
            console.log(job)
            console.log(result);
            this.completionCallback(undefined);
        })

        this._queue.on("error", (err, job) => {
            console.log("Error occured");
            console.log(err);
            console.log(job);
            this.errorCallback?.(err)
        })
    }

    public addJob(config: Omit<StageRenderConfig, 'jobId'>): string {
        const jobId = uuid();
        const jobWorker = new JobWorker({ config: { ...config, jobId }, jobId, isRunning: true }, this.shouldRunHeadless);
        this._jobMap.set({jobId}, jobWorker);
        this._queue.push(() => {
            return jobWorker.complete(this._queue);
        })
        return jobId;
    }

    public getJobStatus(jobId: string): JobStatus {
        const jobWorker = this._jobMap.get({jobId});
        if (!jobWorker) {
            return JobStatus.NOT_FOUND;
        }
        if (!jobWorker.hasStarted) {
            return JobStatus.NOT_STARTED;
        }
        // TODO: Add error case
        return JobStatus.RUNNING;
    }
}

export class JobWorker {
    constructor(private jobConfig: JobConfig, private shouldRunHeadless: boolean) {}

    hasStarted: boolean = false;

    public async complete(ev: EventEmitter): Promise<Job> {

    }
}