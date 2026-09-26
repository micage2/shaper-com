import { DomRegistry as DOM } from '../dom-registry.js';

import TBS from '../dom-comps/top-bottom-static.js';
import LeftRight from '../dom-comps/left-right.js';
import Toolbar from '../dom-comps/toolbar.js';
import SelectBox from '../dom-comps/select-box.js';
import SimpleView from '../dom-comps/simple-view.js';

import TreeEditor from './tree-editor.js';
import TableEditor from './table-editor.js';

const Selector = (options) => DOM.create(SelectBox, options);
const LR = (options) => DOM.create(LeftRight, options);
const Simple = (options) => DOM.create(SimpleView, options);

export default function ModelEditor(hub) {
    if (!hub || typeof hub.on !== 'function') {
        console.error('[ModelEditor] mediator interface required');
        return null;
    }
    
    const rootTBS = DOM.create(TBS, { topHeight: 40 });
    const appToolbar = DOM.create(Toolbar, {});
    
    const modeSelect = Selector({
        options: [
            { value: 'tree', label: 'Tree' },
            { value: 'table', label: 'Table' }
        ],
        value: 'table'
    });
    
    // hub already has the interface needed
    const iTree = hub;    
    const iTable = hub;
    
    const treeEditor = TreeEditor(iTree);
    const tableEditor = TableEditor(iTable);
    appToolbar.add(modeSelect);
    rootTBS.setTop(appToolbar);
    const lr = LR({
        left: Simple(), 
        right: LR({
            left: rootTBS, 
            right: Simple(),
            ratio: .7
        }),
        ratio: .2
    });
    
    modeSelect.on('changed', (msg) => {
        if (msg.value === 'tree') rootTBS.setBottom(treeEditor);
        else if (msg.value === 'table') rootTBS.setBottom(tableEditor);
    });

    return lr;
}
