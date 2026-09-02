// src/compounds/model-tree-editor.js

import { DomRegistry as DOM } from '../dom-registry.js';
import { createTreeInterface } from '../shared/model2tree.js';
import { createRowDataInterface } from '../shared/model2row.js';

import Toolbar from '../dom-comps/toolbar.js';
import SelectBox from '../dom-comps/select-box.js';
import Button from '../dom-comps/button.js';
import TextInput from '../dom-comps/text-input.js';
import TreeView from '../dom-comps/tree-view.js';
import TreeItem from '../dom-comps/tree-item.js';
import PropertyView from '../dom-comps/property-view.js';
import TBS from '../dom-comps/top-bottom-static.js';
import LR from '../dom-comps/left-right.js';
import EditToggle from '../dom-comps/edit-toggle.js';
import EditToggleBox from '../dom-comps/edit-toggle-box.js';

function createAddTypeDialog() {
    const toolbar = DOM.create(Toolbar);
    
    const input = DOM.create(TextInput, { value: '', placeholder: 'Type name' });
    input.on('change', (msg) => toolbar.emit('add-type', msg));

    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('change', (msg) => toolbar.emit('add-type', { value: input.getValue() }));

    const cancel = DOM.create(Button, { label: '✗' });
    
    toolbar.add(input);
    toolbar.add(confirm);
    toolbar.add(cancel);
    
    return toolbar;
}

function createRenameTypeDialog(currentName) {
    const toolbar = DOM.create(Toolbar);
    
    const input = DOM.create(TextInput, { value: currentName, placeholder: "" });
    input.on('change', (msg) => toolbar.emit('rename-type', msg));

    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('change', (msg) => toolbar.emit('add-type', { value: input.getValue() }));

    const cancel = DOM.create(Button, { label: '✗' });
    
    toolbar.add(input);
    toolbar.add(confirm);
    toolbar.add(cancel);
    
    return toolbar;
}

function createAddInstanceDialog(childTypes) {
    const toolbar = DOM.create(Toolbar);
    
    const select = DOM.create(SelectBox, { options: childTypes });
    select.on('change', (msg) => toolbar.emit('add-instance', msg));

    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('change', (msg) => toolbar.emit('add-instance', { value: select.getValue() }));

    const cancel = DOM.create(Button, { label: '✗' });
    
    toolbar.add(select);
    toolbar.add(confirm);
    toolbar.add(cancel);
    
    return toolbar;
}

/**
 * @param {Object} args
 * @param {Array<{value: string, data: string}>} args.typeOptions
 */
function createAddPropertyDialog(args) {
    const toolbar = DOM.create(Toolbar, {});
    const out = { name: '', type: '', target_uuid: '' };
    let typeSelect = null;
    
    const input = DOM.create(TextInput, { value: '', placeholder: 'property name' });
    const inputOff = input.on('change', (msg) => { out.name = msg.value });

    const select = DOM.create(SelectBox, {
        options: [
            { value: '1', label: 'String' },
            { value: '2', label: 'Number' },
            { value: '3', label: 'Boolean' },
            { value: '42', label: 'Link' }
        ]
    });
    const selectOff = select.on('change', (msg) => {
        out.type = msg.value;
        if (msg.value === '42') {
            typeSelect = DOM.create(SelectBox, { options: typeOptions });
            toolbar.add(typeSelect, { after: select });
            typeSelect.on('change', (msg) => { out.type = '42' });
        }
        else {
            if (typeSelect) {
                toolbar.remove(typeSelect);
                typeSelect = null;
            }
        }
    });

    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('change', (msg) => toolbar.emit('add-prop-ok', out));

    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('change', (msg) => toolbar.emit('add-prop-cancel', out));
    
    toolbar.add(input);
    toolbar.add(select);
    toolbar.add(confirm);
    toolbar.add(cancel);
    
    return toolbar;
}

// Main compound factory
export default function createModelTreeEditor(model) {
    if (!model) {
        console.error('[ModelTreeEditor] Model is required');
        return null;
    }
    
    if (!(model.tables instanceof Map)) {
        console.error('[ModelTreeEditor] Model.tables must be a Map');
        return null;
    }
    
    let currentRootUuid = null;
    let currentSelection = null;
    let currentTreeView = null;
    let typeSelector = null;
    
    const mainTBS = DOM.create(TBS, { topHeight: 40 });
    const mainLR = DOM.create(LR, {});
    const mainToolbar = DOM.create(Toolbar, {});
    const editToggleBox = DOM.create(EditToggleBox, {});
    
    if (!mainTBS || !mainLR || !mainToolbar || !editToggleBox) {
        console.error('[ModelTreeEditor] Failed to create components');
        return null;
    }
    
    function getTableOptions() {
        return Array.from(model.tables.values()).map(t => ({
            value: t.uuid,
            label: t.name
        }));
    }
    
    function getChildTypes() {
        if (!currentRootUuid) return [];
        
        const rootTable = model.getTable(currentRootUuid);
        if (!rootTable) return [];
        
        return rootTable.columns
            .filter(col => col.type === 42 && col.targetTableUuid)
            .map(col => {
                const targetTable = model.getTable(col.targetTableUuid);
                return {
                    value: col.targetTableUuid,
                    label: targetTable ? targetTable.name : col.name
                };
            });
    }
    
    function getCurrentTypeName() {
        if (!currentRootUuid) return '';
        const table = model.getTable(currentRootUuid);
        return table ? table.name : '';
    }
    
    function setupTreeListeners(treeView) {
        treeView.on('item-selected', (item) => {
            currentSelection = item;
            refreshProps();
        });
    }
    
    function __refreshTree() {
        if (!currentRootUuid) return;
        
        const newTreeView = DOM.create(TreeView, { itemClsid: TreeItem });
        if (!newTreeView) return;
        
        const treeInterface = createTreeInterface(model, {});
        const { tree } = treeInterface.buildTree(currentRootUuid);
        
        let firstTreeItem = null;
        tree.forEach(node => {
            const item = newTreeView.add(node);
            if (!firstTreeItem) firstTreeItem = item;
        });
        
        setupTreeListeners(newTreeView);
        
        mainLR.setLeft(newTreeView);
        currentTreeView = newTreeView;
        currentSelection = null;
        
        if (firstTreeItem) {
            newTreeView.select(firstTreeItem, true);
        }
    }    

    function refreshTree() {
        if (!currentRootUuid) return;
        
        const newTreeView = DOM.create(TreeView, { itemClsid: TreeItem });
        if (!newTreeView) return;
        
        const treeInterface = createTreeInterface(model, {});
        const { tree } = treeInterface.buildTree(currentRootUuid);
        
        let firstTreeItem = null;
        
        function addNodes(nodes) {
            const stack = [];
            for (let i = nodes.length - 1; i >= 0; i--) {
                stack.push({ node: nodes[i], parent: null });
            }
            
            while (stack.length > 0) {
                const { node, parent } = stack.pop();
                
                if (parent) {
                    newTreeView.select(parent, true);
                } else {
                    newTreeView.select(null, true);
                }
                
                const item = newTreeView.add({
                    label: node.label,
                    icon: node.icon,
                    type: node.type,
                    data: node.data
                });
                
                if (!firstTreeItem) firstTreeItem = item;
                
                if (node.children && node.children.length > 0) {
                    newTreeView.select(item, true);
                    for (let i = node.children.length - 1; i >= 0; i--) {
                        stack.push({ node: node.children[i], parent: item });
                    }
                }
            }
        }
        
        addNodes(tree);
        
        setupTreeListeners(newTreeView);
        
        mainLR.setLeft(newTreeView);
        currentTreeView = newTreeView;
        currentSelection = null;
        
        if (firstTreeItem) {
            newTreeView.select(firstTreeItem);
        }
    }

    function refreshProps() {
        const newPropertyView = DOM.create(PropertyView, {});
        if (!newPropertyView) return;
        
        let tableUuid = currentRootUuid;
        let rowIdx = -1;
        
        if (currentSelection) {
            const data = currentSelection.getData();
            if (data && data.tableUuid) {
                tableUuid = data.tableUuid;
                rowIdx = data.rowId;
            }
        }
        
        if (!tableUuid) {
            mainLR.setRight(newPropertyView);
            return;
        }
        
        const rowInterface = createRowDataInterface(model, tableUuid, rowIdx);
        if (!rowInterface) return;
        
        rowInterface.getColumns().forEach(col => {
            const value = rowIdx >= 0 ? rowInterface.getValue(col.colId) : '';
            
            switch (col.type) {
                case 1:
                    newPropertyView.addString(col.name, value);
                    break;
                case 2:
                    newPropertyView.addNumber(col.name, value);
                    break;
                case 3:
                    newPropertyView.addBoolean(col.name, value);
                    break;
                case 42:
                    newPropertyView.addLink(col.name, rowInterface.getLinkInfo(col.colId), value);
                    break;
            }
        });
        
        mainLR.setRight(newPropertyView);
    }
    
    function selectType(tableUuid) {
        currentRootUuid = tableUuid;
        if (typeSelector) {
            typeSelector.setOptions(getTableOptions());
            typeSelector.setValue(tableUuid);
        }
        refreshTree();
    }
    
    // Create type selector
    typeSelector = DOM.create(SelectBox, { options: getTableOptions() });
    if (!typeSelector) return null;
    
    typeSelector.on('change', (msg) => {
        selectType(msg.value);
    });
    
    // Create edit toggles
    const addTypeToggle = DOM.create(EditToggle, { idleLabel: '+ Type' });
    const renameTypeToggle = DOM.create(EditToggle, { idleLabel: 'Rename' });
    const addInstanceToggle = DOM.create(EditToggle, { idleLabel: '+ Instance' });
    const addPropertyToggle = DOM.create(EditToggle, { idleLabel: '+ Property' });
    
    if (!addTypeToggle || !renameTypeToggle || !addInstanceToggle || !addPropertyToggle) return null;
    
    // Wire AddType toggle
    addTypeToggle.on('edit', () => {
        const dialog = createAddTypeDialog();
        if (!dialog) {
            console.error("createAddTypeDialog failed");            
            return;
        }
        
        addTypeToggle.setEditComponent(dialog.root);
        dialog.input.focus();
        
        dialog.confirm.on('click', () => {
            const name = dialog.input.getValue().trim();
            if (name) {
                model.createTable(name);
                addTypeToggle.exitEditMode();
                typeSelector.setOptions(getTableOptions());
                const tables = Array.from(model.tables.values());
                if (tables.length > 0) {
                    selectType(tables[tables.length - 1].uuid);
                }
            }
        });
        
        dialog.cancel.on('click', () => {
            addTypeToggle.exitEditMode();
        });
    });
    
    // Wire RenameType toggle
    renameTypeToggle.on('edit', () => {
        const dialog = createRenameTypeDialog(getCurrentTypeName());
        if (!dialog) return;
        
        renameTypeToggle.setEditComponent(dialog.root);
        dialog.input.focus();
        dialog.input.select();
        
        dialog.confirm.on('click', () => {
            const name = dialog.input.getValue().trim();
            if (name && currentRootUuid) {
                model.renameTable(currentRootUuid, name);
                renameTypeToggle.exitEditMode();
                typeSelector.setOptions(getTableOptions());
                typeSelector.setValue(currentRootUuid);
            }
        });
        
        dialog.cancel.on('click', () => {
            renameTypeToggle.exitEditMode();
        });
    });
    
    // Wire AddInstance toggle
    addInstanceToggle.on('edit', () => {
        const dialog = createAddInstanceDialog(getChildTypes());
        if (!dialog) return;
        
        addInstanceToggle.setEditComponent(dialog.root);
        
        dialog.confirm.on('click', () => {
            const childType = dialog.select.getValue();
            if (childType) {
                const table = model.getTable(childType);
                if (table) {
                    table.addRow({});
                    addInstanceToggle.exitEditMode();
                    refreshTree();
                }
            }
        });
        
        dialog.cancel.on('click', () => {
            addInstanceToggle.exitEditMode();
        });
    });
    
    // Wire AddProperty toggle
    addPropertyToggle.on('edit', () => {
        const dialog = createAddPropertyDialog();
        if (!dialog) return;
        
        addPropertyToggle.setEditComponent(dialog.root);
        dialog.input.focus();
        
        dialog.confirm.on('click', () => {
            const name = dialog.input.getValue().trim();
            const type = parseInt(dialog.select.getValue());
            if (name && currentRootUuid) {
                const table = model.getTable(currentRootUuid);
                if (table) {
                    const spec = { name, type };
                    if (type === 42) {
                        const tables = Array.from(model.tables.values());
                        if (tables.length > 0) {
                            spec.targetTableUuid = tables[0].uuid;
                        }
                    }
                    table.addColumn(spec);
                    addPropertyToggle.exitEditMode();
                    refreshProps();
                }
            }
        });
        
        dialog.cancel.on('click', () => {
            addPropertyToggle.exitEditMode();
        });
    });
    
    // Add toggles to EditToggleBox
    editToggleBox.add(addTypeToggle);
    editToggleBox.add(renameTypeToggle);
    editToggleBox.add(addInstanceToggle);
    editToggleBox.add(addPropertyToggle);
    
    // Delete buttons
    const deleteTypeBtn = DOM.create(Button, { label: 'Delete Type' });
    const deleteInstanceBtn = DOM.create(Button, { label: 'Delete Instance' });
    
    if (deleteTypeBtn) {
        deleteTypeBtn.on('click', () => {
            if (currentRootUuid) {
                model.deleteTable(currentRootUuid);
                typeSelector.setOptions(getTableOptions());
                const tables = Array.from(model.tables.values());
                if (tables.length > 0) {
                    selectType(tables[0].uuid);
                } else {
                    currentRootUuid = null;
                    mainLR.setLeft(null);
                    mainLR.setRight(null);
                }
            }
        });
        mainToolbar.add(deleteTypeBtn);
    }
    
    if (deleteInstanceBtn) {
        deleteInstanceBtn.on('click', () => {
            if (currentSelection) {
                const data = currentSelection.getData();
                if (data && data.tableUuid) {
                    const table = model.getTable(data.tableUuid);
                    if (table) {
                        table.deleteRow(data.rowId);
                        refreshTree();
                    }
                }
            }
        });
        mainToolbar.add(deleteInstanceBtn);
    }
    
    // Assemble toolbar
    mainToolbar.add(typeSelector);
    mainToolbar.add(editToggleBox);
    
    // Assemble layout
    mainTBS.setTop(mainToolbar);
    mainTBS.setBottom(mainLR);
    
    // Initial tree
    const tables = Array.from(model.tables.values());
    if (tables.length > 0) {
        selectType(tables[0].uuid);
    }
    
    return mainTBS;
}