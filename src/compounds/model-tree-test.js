import { DomRegistry as DOM } from '../dom-registry.js';
import TreeView from '../dom-comps/tree-view.js';
import TreeItem from '../dom-comps/tree-item.js';
import SelectBox from '../dom-comps/select-box.js';
import Toolbar from '../dom-comps/toolbar.js';
import TopBottomStatic from '../dom-comps/top-bottom-static.js';
import { createTreeInterface } from '../shared/model2tree.js';

const $$ = DOM.create;

function createModelTreeTest(model) {
    const tableEntries = Array.from(model.tables.values());
    const treeIface = createTreeInterface(model);
    
    let wrapper = null;
    let treeView = null;
    
    function buildTreeView(rootTableUuid) {
        const newTreeView = $$(TreeView, { itemClsid: TreeItem });
        
        const items = treeIface.buildTree(rootTableUuid);
        for (const itemData of items) {
            newTreeView.add(itemData);
        }
        
        return newTreeView;
    }
    
    function switchTable(uuid) {
        const newTreeView = buildTreeView(uuid);
        
        if (treeView) {
            DOM.detach(treeView);
        }
        
        treeView = newTreeView;
        DOM.attach(treeView, wrapper, { slot: 'bottom' });
    }
    
    const tableSelect = $$(SelectBox, {
        options: tableEntries.map(t => ({ value: t.uuid, label: t.name })),
        value: tableEntries[0].uuid,
        onChange: (uuid) => {
            switchTable(uuid);
        }
    });
    
    const toolbar = $$(Toolbar);
    toolbar.add(tableSelect);
    
    treeView = buildTreeView(tableEntries[0].uuid);
    
    wrapper = $$(TopBottomStatic, {
        topHeight: 40,
        top: toolbar,
        bottom: treeView
    });
    
    return wrapper;
}

export default createModelTreeTest;