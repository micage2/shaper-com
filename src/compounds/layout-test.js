import { DomRegistry as DOM } from '../dom-registry.js';
import SimpleView from '../dom-comps/simple-view.js';
import LeftRight from '../dom-comps/left-right.js';
import TopBottom from '../dom-comps/top-bottom.js';

const $$ = DOM.create;

function createLayoutTest(componentToTest) {
    const Simple = (title) => $$(SimpleView, { title });
    
    const test = $$(LeftRight, {
        ratio: 0.3,
        left: Simple('Left'),
        right: $$(LeftRight, {
            ratio: 0.5,
            left: $$(TopBottom, {
                ratio: 0.2,
                top: Simple('Top'),
                bottom: $$(TopBottom, {
                    ratio: 0.5,
                    top: componentToTest,
                    bottom: Simple('Bottom')
                })
            }),
            right: Simple('Right')
        })
    });
    
    return test;
}

export default createLayoutTest;