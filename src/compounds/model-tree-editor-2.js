// src/compounds/model-tree-editor.js

import { DomRegistry as DOM } from '../dom-registry.js';
import { createTreeInterface } from '../shared/model2tree.js';
import { createRowDataInterface } from '../shared/model2row.js';

import TBS from '../dom-comps/top-bottom-static.js';
import LR from '../dom-comps/left-right.js';
import Toolbar from '../dom-comps/toolbar.js';
import SelectBox from '../dom-comps/select-box.js';
import Button from '../dom-comps/button.js';
import TextInput from '../dom-comps/text-input.js';
import Label from '../dom-comps/label.js';
import TreeView from '../dom-comps/tree-view.js';
import TreeItem from '../dom-comps/tree-item.js';
import PropertyView from '../dom-comps/property-view.js';
import EditToggleId from '../dom-comps/edit-toggle.js';
import EditToggleBox from '../dom-comps/edit-toggle-box.js';

// helper
const Selector = (options) => DOM.create(SelectBox, options);
const EditToggle = (args) => DOM.create(EditToggleId, args);

function getTableOptions(model) {
    return Array.from(model.tables.values()).map(t => ({
        value: t.uuid,
        label: t.name
    }));
}

function getChildTypes(model, node) {
    const rootTable = model.getTable(rootUuid);
    if (!rootTable) return [];
    
    return rootTable.columns
        .filter(col => col.type === 42 && col.targetTableUuid)
        .map(col => {
            const targetTable = model.getTable(col.targetTableUuid);
            return {
                value: col.targetTableUuid,
                label: targetTable ? targetTable.name : col.name
            };
        })
    ;
}

// Type dialogs
function AddTypeDialog() {
    const toolbar = DOM.create(Toolbar, {});
    const out = { name: '' };
    
    const input = DOM.create(TextInput, { value: '', placeholder: 'Type name' });
    input.on('change', (msg) => { out.name = msg.value; });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('click', () => toolbar.emit('close', out));
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('click', () => toolbar.emit('close'));
    
    toolbar.add(input);
    toolbar.add(confirm);
    toolbar.add(cancel);
    
    return toolbar;
}

function RenameTypeDialog(currentName) {
    const toolbar = DOM.create(Toolbar, {});
    const out = { name: currentName };
    
    const input = DOM.create(TextInput, { value: currentName, placeholder: 'New name' });
    input.on('change', (msg) => { out.name = msg.value; });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('click', () => toolbar.emit('close', out));
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('click', () => toolbar.emit('close'));
    
    toolbar.add(input);
    toolbar.add(confirm);
    toolbar.add(cancel);
    
    return toolbar;
}

function DeleteTypeDialog(question) {
    const toolbar = DOM.create(Toolbar, {});
    
    const label = DOM.create(Label, { text: question });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('click', () => toolbar.emit('close'));
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('click', () => toolbar.emit('close'));
    
    toolbar.add(label);
    toolbar.add(confirm);
    toolbar.add(cancel);
    
    return toolbar;
}

// Instance dialogs
function AddInstanceDialog(childTypes) {
    const toolbar = DOM.create(Toolbar, {});
    const out = { childType: '' };
    
    const select = DOM.create(SelectBox, { options: childTypes });
    out.childType = select.getValue();
    select.on('change', (msg) => { out.childType = msg.value; });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('click', () => toolbar.emit('close', out));
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('click', () => toolbar.emit('close'));
    
    toolbar.add(select);
    toolbar.add(confirm);
    toolbar.add(cancel);
    
    return toolbar;
}

function DeleteInstanceDialog(question) {
    const toolbar = DOM.create(Toolbar);
    
    const label = DOM.create(Label, { text: question });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('click', () => toolbar.emit('close'));
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('click', () => toolbar.emit('close'));
    
    toolbar.add(label);
    toolbar.add(confirm);
    toolbar.add(cancel);
    
    return toolbar;
}

// Property dialogs
function AddPropertyDialog(typeOptions) {
    const toolbar = DOM.create(Toolbar, {});
    const out = { name: '', type: '', target_uuid: '' };
    let typeSelect = null;
    
    const input = DOM.create(TextInput, { value: '', placeholder: 'Property name' });
    input.on('change', (msg) => { out.name = msg.value; });
    
    const select = DOM.create(SelectBox, {
        options: [
            { value: '1', label: 'String' },
            { value: '2', label: 'Number' },
            { value: '3', label: 'Boolean' },
            { value: '42', label: 'Link' }
        ]
    });
    out.type = select.getValue();
    select.on('change', (msg) => {
        out.type = msg.value;
        if (msg.value === '42') {
            typeSelect = DOM.create(SelectBox, { options: typeOptions });
            toolbar.add(typeSelect, { after: select });
            out.target_uuid = typeSelect.getValue();
            typeSelect.on('change', (msg) => { out.target_uuid = msg.value; });
        }
        else {
            if (typeSelect) {
                toolbar.remove(typeSelect);
                typeSelect = null;
                out.target_uuid = '';
            }
        }
    });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('click', () => {
        toolbar.emit('close', out)
    });
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('click', () =>{
        toolbar.emit('close')
    });
    
    toolbar.add(input);
    toolbar.add(select);
    toolbar.add(confirm);
    toolbar.add(cancel);
    
    return toolbar;
}

function DeletePropertyDialog(question) {
    const toolbar = DOM.create(Toolbar);
    
    const label = DOM.create(Label, { text: question });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('click', () => toolbar.emit('close'));
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('click', () => toolbar.emit('close'));
    
    toolbar.add(label);
    toolbar.add(confirm);
    toolbar.add(cancel);
    
    return toolbar;
}

// TreeView builder
function buildTree(model, rootUuid) {
    const treeView = DOM.create(TreeView, { itemClsid: TreeItem });
    if (!treeView) return null;
    
    const treeInterface = createTreeInterface(model, {});
    const { tree } = treeInterface.buildTree(rootUuid);
    
    let firstItem = null;
    
    function addNodes(nodes) {
        const stack = [];
        for (let i = nodes.length - 1; i >= 0; i--) {
            stack.push({ node: nodes[i], parent: null });
        }
        
        while (stack.length > 0) {
            const { node, parent } = stack.pop();
            
            if (parent) {
                treeView.select(parent, true);
            } else {
                treeView.select(null, true);
            }
            
            const item = treeView.add({
                label: node.label,
                icon: node.icon,
                type: node.type,
                data: node.data
            });
            
            if (!firstItem) firstItem = item;
            
            if (node.children && node.children.length > 0) {
                treeView.select(item, true);
                for (let i = node.children.length - 1; i >= 0; i--) {
                    stack.push({ node: node.children[i], parent: item });
                }
            }
        }
    }
    
    addNodes(tree);
    
    return { treeView, firstItem };
}

// PropertyView builder
function buildProps(model, tableUuid, rowIdx) {
    const propView = DOM.create(PropertyView, {});
    if (!propView) return null;
    
    const rowInterface = createRowDataInterface(model, tableUuid, rowIdx);
    if (!rowInterface) return propView;
    
    rowInterface.getColumns().forEach(col => {
        const value = rowIdx >= 0 ? rowInterface.getValue(col.colId) : '';
        
        switch (col.type) {
            case 1:
                propView.addString(col.name, value);
                break;
            case 2:
                propView.addNumber(col.name, value);
                break;
            case 3:
                propView.addBoolean(col.name, value);
                break;
            case 42:
                propView.addLink(col.name, rowInterface.getLinkInfo(col.colId), value);
                break;
        }
    });
    
    return propView;
}

// Main compound
export default function createModelTreeEditor(model) {
    if (!model) {
        console.error('[ModelTreeEditor] Model is required');
        return null;
    }
    
    // UI layout
    const mainTBS = DOM.create(TBS, { topHeight: 40 });
    const mainLR = DOM.create(LR, {});
    const mainToolbar = DOM.create(Toolbar, {});
    const editToggleBox = DOM.create(EditToggleBox, {
        centerLabel: 'Instance:',
        rightLabel: 'Property:'
    });
    
    const typeSelector = Selector({ options: getTableOptions(model) });
    typeSelector.on('change', (msg) => {
        const result = buildTree(model, msg.value);
        if (result) {
            mainLR.setLeft(result.treeView);
            mainLR.setRight(DOM.create(PropertyView, {}));
            
            result.treeView.on('item-selected', (item) => {
                const data = item.getData();
                const propView = buildProps(model, data.tableUuid, data.rowId);
                mainLR.setRight(propView);
            });
            
            if (result.firstItem) {
                result.treeView.select(result.firstItem);
            }
        }
    });
    
    // ================ Edit Mode Dialogs ================
    // ---- Type add
    const addTypeDialog = AddTypeDialog();
    addTypeDialog.on('close', (msg) => {
        if (!msg) return; // cancel
        
        const table = model.createTable(msg.name);
        if (table) {
            typeSelector.addOption(msg.name, table.uuid);
            typeSelector.setValue(table.uuid);
            typeSelector.emit('change', { value: table.uuid });
        }
    });    
    const addTypeToggle = EditToggle({
        idleLabel: 'New', 
        editCompound: addTypeDialog
    });
    editToggleBox.add(addTypeToggle, 'left');
    
    // ---- Type rename
    const renameTypeDialog = RenameTypeDialog('');
    renameTypeDialog.on('close', (msg) => {
        if (!msg) return; // cancel

        const rootUuid = typeSelector.getValue();
        if (rootUuid && model.renameTable(rootUuid, msg.name)) {
            typeSelector.setLabel(rootUuid, msg.name);
        }
    });
    const renameTypeToggle = EditToggle({
        idleLabel: 'Rename',
        editCompound: renameTypeDialog
    });
    editToggleBox.add(renameTypeToggle, 'left');

    // ---- Type delete
    const deleteTypeDialog = DeleteTypeDialog('Delete type?');
    deleteTypeDialog.on('close', () => {
        const rootUuid = typeSelector.getValue();
        if (rootUuid) {
            model.deleteTable(rootUuid);
            typeSelector.removeOption(rootUuid);
            const tables = Array.from(model.tables.values());
            if (tables.length > 0) {
                typeSelector.setValue(tables[0].uuid);
                typeSelector.emit('change', { value: tables[0].uuid });
            } else {
                mainLR.setLeft(null);
                mainLR.setRight(null);
            }
        }
    });
    const deleteTypeToggle = EditToggle({
        idleLabel: 'Delete',
        editCompound: deleteTypeDialog
    });
    editToggleBox.add(deleteTypeToggle, 'left');

    // ---- Instance add
    // const types = getChildTypes(model, node);
    const addInstanceDialog = AddInstanceDialog([]);
    addInstanceDialog.on('close', (msg) => {
        if (!msg) return; // cancel

        const table = model.getTable(msg.childType);
        if (table) {
            table.addRow({});
            const rootUuid = typeSelector.getValue();
            const result = buildTree(model, rootUuid);
            if (result) {
                mainLR.setLeft(result.treeView);
            }
        }
    });
    const addInstanceToggle = EditToggle({
        idleLabel: 'New',
        editCompound: addInstanceDialog
    });
    editToggleBox.add(addInstanceToggle, 'center');

    // ---- Instance delete
    const deleteInstanceDialog = DeleteInstanceDialog('Delete instance?');
    deleteInstanceDialog.on('close', () => {
    });
    const deleteInstanceToggle = EditToggle({
        idleLabel: 'Delete',
        editCompound: deleteInstanceDialog
    });
    editToggleBox.add(deleteInstanceToggle, 'center');
    
    // ---- Property add
    const addPropertyDialog = AddPropertyDialog(getTableOptions(model));
    addPropertyDialog.on('close', (msg) => {
        if (!msg) return; // cancel

        const rootUuid = typeSelector.getValue();
        const table = model.getTable(rootUuid);
        if (table) {
            table.addColumn({
                name: msg.name,
                type: parseInt(msg.type),
                targetTableUuid: msg.target_uuid || null
            });
        }
    });
    const addPropertyToggle = EditToggle({
        idleLabel: 'New',
        editCompound: addPropertyDialog
    });
    editToggleBox.add(addPropertyToggle, 'right');

    // ---- Property delete
    const deletePropertyDialog = DeletePropertyDialog('Delete property?');
    deletePropertyDialog.on('close', () => {
    });
    const deletePropertyToggle = EditToggle({
        idleLabel: 'Delete',
        editCompound: deletePropertyDialog
    });
    editToggleBox.add(deletePropertyToggle, 'right');
    
    // Assemble
    mainToolbar.add(typeSelector);
    mainToolbar.add(editToggleBox);
    
    mainTBS.setTop(mainToolbar);
    mainTBS.setBottom(mainLR);
    
    // Initial state
    const tables = Array.from(model.tables.values());
    if (tables.length > 0) {
        typeSelector.setValue(tables[0].uuid);
        typeSelector.emit('change', { value: tables[0].uuid });
    }
    
    return mainTBS;
}