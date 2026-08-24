import { DomRegistry as DOM } from '../dom-registry.js';
import TreeView from '../dom-comps/tree-view.js';
import TreeItem from '../dom-comps/tree-item.js';
import Toolbar from '../dom-comps/toolbar.js';
import Button from '../dom-comps/button.js';
import TopBottomStatic from '../dom-comps/top-bottom-static.js';

const $$ = DOM.create;

function createTreeViewTest() {
    const treeView = $$(TreeView, {
        itemClsid: TreeItem
    });
    
    const toolbar = $$(Toolbar);
    
    const addFolderBtn = $$(Button, {
        label: '+ Folder',
        onClick: () => {
            const selected = treeView.getSelected();
            const depth = selected ? selected.getDepth() + 1 : 0;
            
            treeView.add({
                label: 'New Folder',
                icon: '📁',
                type: 'folder',
                depth: depth
            });
        }
    });
    
    const addLeafBtn = $$(Button, {
        label: '+ File',
        onClick: () => {
            const selected = treeView.getSelected();
            const depth = selected ? selected.getDepth() + 1 : 0;
            
            treeView.add({
                label: 'New Leaf',
                icon: '📄',
                type: 'leaf',
                depth: depth
            });
        }
    });
    
    const deleteBtn = $$(Button, {
        label: '🗑',
        onClick: () => {
            const selected = treeView.getSelected();
            if (selected) {
                treeView.remove(selected);
            }
        }
    });
    
    toolbar.add(addFolderBtn);
    toolbar.add(addLeafBtn);
    toolbar.add(deleteBtn);
    
    const test = $$(TopBottomStatic, {
        topHeight: 40,
        top: toolbar,
        bottom: treeView
    });
    
    return test;
}

export default createTreeViewTest;