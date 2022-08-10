
export interface StageRenderConfig {
    url: string;
    hdri: string;
    jobId: string;
    renderResolution: [number, number];
    samples: number;
    bounces: number;
    filterGlossyFactor: number;
    environmentIntensity: number;
    iesUri?: string;
    cameraNamespace?: string;
}
