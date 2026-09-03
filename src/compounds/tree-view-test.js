import { DomRegistry as DOM } from '../dom-registry.js';
import TreeView from '../dom-comps/tree-view.js';
import TreeItem from '../dom-comps/tree-item.js';
import Toolbar from '../dom-comps/toolbar.js';
import Button from '../dom-comps/button.js';
import TopBottomStatic from '../dom-comps/top-bottom-static.js';
import LayoutTest from './layout-test.js';

const $$ = DOM.create;

function createTreeViewTest(layoutTest = false) {
    const treeView = $$(TreeView, {
        itemClsid: TreeItem
    });
    
    const toolbar = $$(Toolbar);
    
    const addFolderBtn = $$(Button, { label: '+ Folder' });
    addFolderBtn.on('click', () => {
        treeView.add({
            label: 'New Folder',
            icon: '📁',
            type: 'folder',
        });
    });
    
    const addLeafBtn = $$(Button, { label: '+ File' });
    addLeafBtn.on('click', () => treeView.add({
        label: 'New Leaf',
        icon: '📄',
        type: 'leaf'
    }));
    
    const deleteBtn = $$(Button, { label: '🗑' });
    deleteBtn.on('click', () => {
        const selected = treeView.getSelected();
        if (selected) {
            treeView.remove(selected);
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
    
    return layoutTest ? LayoutTest(test) : test;
}

export default createTreeViewTest;