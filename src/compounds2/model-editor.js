import { DomRegistry as DOM } from '../dom-registry.js';
import { LoadFile } from '../shared/dom-helper.js';

import TBS from '../dom-comps/top-bottom-static.js';
import LeftRight from '../dom-comps/left-right.js';
import Toolbar from '../dom-comps/toolbar.js';
import SelectBox from '../dom-comps/select-box.js';
import SimpleView from '../dom-comps/simple-view.js';

import TreeEditor from './model-tree-editor.js';
import TableEditor from './table-editor.js';
import Button from '../dom-comps/button.js';

const Selector = (options) => DOM.create(SelectBox, options);
const LR = (options) => DOM.create(LeftRight, options);
const Simple = (options) => DOM.create(SimpleView, options);

export default function ModelEditor(db) {
    if (!db || typeof db.on !== 'function') {
        console.error('[ModelEditor] mediator interface required');
        return null;
    }

    console.log('⚙️', '[ModelEditor]', 'add Load/Save buttons');
    
    const rootTBS = DOM.create(TBS, { topHeight: 50 });
    const appToolbar = DOM.create(Toolbar, {});
    
    const modeSelect = Selector({
        options: [
            { value: 'tree', label: 'Tree' },
            { value: 'table', label: 'Table' }
        ],
        value: 'table' // initial choice
    });
    
    // hub already has the interface needed
    const iTree = db;    
    const iTable = db;
    
    const treeEditor = null; // TreeEditor(iTree, []);
    const tableEditor = null; // TableEditor(iTable);
    appToolbar.add(modeSelect);
    rootTBS.setTop(appToolbar);
    const lr = LR({
        left: Simple(), 
        right: LR({
            left: rootTBS, 
            right: Simple(),
            ratio: 1
        }),
        ratio: 0
    });
    console.log('⚙️', '[ME]', 'make ratio depend on available screen size');

    const loadButton = DOM.create(Button, { label: 'Load' });
    loadButton.setIcon('load');
    loadButton.on('clicked', () => {
        console.log('⚙️', '[ME]', 'Loading file');
        LoadFile('./data/test-data-03.json').then((data)=> {
            db.load(data);
            const value = modeSelect.getValue('table');
            modeSelect.emit('changed', { value });
        });

    });
    appToolbar.add(loadButton);

    const saveButton = DOM.create(Button, { label: 'Save' });
    saveButton.setIcon('save');
    saveButton.on('clicked', () => {
        console.log('⚙️', '[ME]', 'Saving file');
    });
    appToolbar.add(saveButton);
    
    const treeUnsubs = [];
    modeSelect.on('changed', (msg) => {
        // if (msg.value === 'tree') rootTBS.setBottom(TreeEditor(iTree));
        if (msg.value === 'tree') rootTBS.setBottom(TreeEditor(iTree, treeUnsubs));
        // if (msg.value === 'tree') rootTBS.setBottom(Simple("No"));
        else if (msg.value === 'table') rootTBS.setBottom(TableEditor(iTable));
    });

    return lr;
}
