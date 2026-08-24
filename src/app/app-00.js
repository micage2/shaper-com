import { DomRegistry as DOM } from '../dom-registry.js';
import SimpleView from '../dom-comps/simple-view.js';
import LeftRight from '../dom-comps/left-right.js';
import TopBottom from '../dom-comps/top-bottom.js';

const $$ = DOM.create;
const Simple = (title) => $$(SimpleView, { title });

// Build component tree
const leftRight = $$(LeftRight, { ratio: 0.3 })
    .LeftRight.setLeft(Simple("Left Panel"))
    .LeftRight.setRight(Simple("Right Panel"));

const app = $$(TopBottom, { ratio: 0.1 })
    .TopBottom.setTop(Simple("Toolbar"))
    .TopBottom.setBottom(leftRight);

// Mount to DOM
DOM.mount(app);
