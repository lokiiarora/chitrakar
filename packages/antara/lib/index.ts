import { BrowserQueue } from './controller/BrowserQueue';
import * as express from 'express';
import { DEFAULT_PORT, DEFAULT_CHITRAKAR_PATH } from './constants';


const server = express();
const PORT = DEFAULT_PORT;

server.use(express.static(DEFAULT_CHITRAKAR_PATH));

server.listen(PORT);

const jobQueue = new BrowserQueue(true, (job) => { console.log("Job Complete", job) }, undefined)

jobQueue.addJob({
    samples: 500,
    hdri: 'http://localhost:5000/assets/solitude_interior_1k.hdr',
    bounces: 20,
    environmentIntensity: 2,
    url: "http://localhost:5000/assets/DragonAttenuation.glb",
    renderResolution: [1024, 1024],
    filterGlossyFactor: 0.5
})

jobQueue.addJob({
    samples: 100,
    hdri: 'http://localhost:5000/assets/solitude_interior_1k.hdr',
    bounces: 20,
    environmentIntensity: 2,
    url: "http://localhost:5000/assets/DragonAttenuation.glb",
    renderResolution: [512, 512],
    filterGlossyFactor: 0.5
})


