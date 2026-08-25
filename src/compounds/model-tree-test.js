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
    const treeIface = createTreeInterface(model, {
        icons: {
            'City': '🏙',
            'Building': '🏢',
            'Country': '🌍',
            'Person': '👤',
            'Architect': '📐'
        }
    });
        
    let wrapper = null;
    let treeView = null;
    
    function addNodes(nodes, iTreeView) {
        const stack = [];
        
        for (const node of nodes) {
            stack.push({ node, parent: null });
        }
        
        while (stack.length > 0) {
            const { node, parent } = stack.pop();
            
            if (parent) {
                iTreeView.select(parent, true);
            } else {
                iTreeView.select(null, true);
            }
            
            const item = iTreeView.add({
                label: node.label,
                icon: node.icon,
                type: node.type,
                data: node.data
            });
            
            if (node.children && node.children.length > 0) {
                iTreeView.select(item, true);
                
                for (let i = node.children.length - 1; i >= 0; i--) {
                    stack.push({ node: node.children[i], parent: item });
                }
            }
        }
    }
    
    function buildTreeView(rootTableUuid) {
        const newTreeView = $$(TreeView, { itemClsid: TreeItem });
        
        const roots = treeIface.buildTree(rootTableUuid);
        addNodes(roots, newTreeView);
        
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