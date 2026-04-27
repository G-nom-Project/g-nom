export interface TrackableJob {
    id: number;
    job_class: string;
    queue: string;
    payload: object | null;
    progress: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result: object | null;
    created_at: Date;
    started_at: Date;
    finished_at: Date;
    user_id: number;
}
