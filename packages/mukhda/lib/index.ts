import type { StageRenderConfig } from './types/StageRenderConfig';
import type { CustomTypedEvent } from './types/Events';
import { Stage } from './controllers/Stage';
import { Logger } from './components/Logger';

const url = new URL(location.toString());

console.log()

const stage = new Stage({
    debug: Boolean(url.searchParams.get("debug"))
});


window.addEventListener("render-payload", (e) => {
    const event = e as CustomTypedEvent<StageRenderConfig>;
    Logger.debug(`Got event: ${JSON.stringify(event.detail)}`);
    stage.startRender(event.detail);
});

window.addEventListener('render-complete', (e) => {
    const event = e as CustomEvent;
    console.log(`Render complete, ${JSON.stringify(event.detail)}`);
})