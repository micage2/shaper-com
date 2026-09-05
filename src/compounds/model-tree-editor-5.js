// src/compounds/model-tree-editor-4.js

import { DomRegistry as DOM } from '../dom-registry.js';
import { createTreeInterface } from '../shared/model2tree.js';

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
import EditToggleBox from '../dom-comps/edit-toggle-box.js';

const Selector = (options) => DOM.create(SelectBox, options);

function getTableOptions(model) {
    return Array.from(model.tables.values()).map(t => ({
        value: t.uuid,
        label: t.name
    }));
}

function getCurrentName(model, tableUuid) {
    const table = model.getTable(tableUuid);
    return table ? table.name : '';
}

// IdleButtonDialog
function IdleButtonDialog(label) {
    const button = DOM.create(Button, { label });
    button.on('clicked', function() {
        this.emit('close');
    });
    return button;
}

// TypeSelectDialog - idle-mode dialog, never closes
function TypeSelectDialog(args) {
    const model = args.model;
    const select = Selector({ options: getTableOptions(model) });
    
    model.on('table.created', function(data) {
        select.addOption(data.name, data.uuid);
    });
    
    model.on('table.renamed', function(data) {
        select.setLabel(data.uuid, data.newName);
    });
    
    model.on('table.deleted', function(data) {
        const wasSelected = select.getValue() === data.uuid;
        select.removeOption(data.uuid);
        
        if (wasSelected) {
            const tables = Array.from(model.tables.values());
            if (tables.length > 0) {
                select.setValue(tables[0].uuid);
                select.emit('changed', { value: tables[0].uuid });
            } else {
                select.emit('changed', { value: null });
            }
        }
    });
    
    select.on('changed', function(msg) {
        this.emit('table-selected', { tableUuid: msg.value });
    });
    
    return select;
}

// AddTypeDialog - edit-mode dialog
function AddTypeDialog(args) {
    const model = args.model;
    const toolbar = DOM.create(Toolbar, {});
    const input = DOM.create(TextInput, { value: '', placeholder: 'Type name' });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', function() {
        const name = input.getValue().trim();
        if (name) {
            const table = model.createTable(name);
            toolbar.emit('close', { tableUuid: table.uuid, tableName: name });
        } else {
            toolbar.emit('close');
        }
    });
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('clicked', function() {
        toolbar.emit('close');
    });
    
    toolbar.add(input);
    toolbar.add(confirm);
    toolbar.add(cancel);
    
    return toolbar;
}

// RenameTypeDialog - edit-mode dialog
function RenameTypeDialog(args) {
    const model = args.model;
    const tableUuid = args.tableUuid;
    const toolbar = DOM.create(Toolbar, {});
    const input = DOM.create(TextInput, { 
        value: getCurrentName(model, tableUuid), 
        placeholder: 'New name' 
    });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', function() {
        const name = input.getValue().trim();
        if (name) {
            model.renameTable(tableUuid, name);
            toolbar.emit('close', { tableUuid, tableName: name });
        } else {
            toolbar.emit('close');
        }
    });
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('clicked', function() {
        toolbar.emit('close');
    });
    
    toolbar.add(input);
    toolbar.add(confirm);
    toolbar.add(cancel);
    
    return toolbar;
}

// DeleteTypeDialog - edit-mode dialog
function DeleteTypeDialog(args) {
    const model = args.model;
    const tableUuid = args.tableUuid;
    const toolbar = DOM.create(Toolbar, {});
    const label = DOM.create(Label, { text: `Delete '${getCurrentName(model, tableUuid)}'?` });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', function() {
        model.deleteTable(tableUuid);
        toolbar.emit('close', { tableUuid });
    });
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('clicked', function() {
        toolbar.emit('close');
    });
    
    toolbar.add(label);
    toolbar.add(confirm);
    toolbar.add(cancel);
    
    return toolbar;
}

// AddInstanceDialog - edit-mode dialog, creates row in selected table
function AddInstanceDialog(args) {
    const model = args.model;
    const tableUuid = args.tableUuid;
    const tableName = getCurrentName(model, tableUuid);
    
    const toolbar = DOM.create(Toolbar, {});
    const label = DOM.create(Label, { text: `New ${tableName}` });
    const input = DOM.create(TextInput, { value: '', placeholder: 'Name' });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', function() {
        const name = input.getValue().trim();
        const table = model.getTable(tableUuid);
        const rowData = {};
        
        // Find first string column to set the name
        const nameColumn = table.columns.find(col => col.type === 1);
        if (nameColumn && name) {
            rowData[nameColumn.colId] = name;
        }
        
        const row = table.addRow(rowData);
        toolbar.emit('close', { tableUuid, rowId: row.id });
    });
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('clicked', function() {
        toolbar.emit('close');
    });
    
    toolbar.add(label);
    toolbar.add(input);
    toolbar.add(confirm);
    toolbar.add(cancel);
    
    return toolbar;
}

// DeleteInstanceDialog - edit-mode dialog, deletes selected row
function DeleteInstanceDialog(args) {
    const model = args.model;
    const tableUuid = args.tableUuid;
    const rowId = args.rowId;
    const toolbar = DOM.create(Toolbar, {});
    const label = DOM.create(Label, { text: 'Delete instance?' });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', function() {
        const table = model.getTable(tableUuid);
        if (table) {
            table.deleteRow(rowId);
            toolbar.emit('close', { tableUuid, rowId });
        } else {
            toolbar.emit('close');
        }
    });
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('clicked', function() {
        toolbar.emit('close');
    });
    
    toolbar.add(label);
    toolbar.add(confirm);
    toolbar.add(cancel);
    
    return toolbar;
}

// AddPropertyDialog - edit-mode dialog
function AddPropertyDialog(args) {
    const model = args.model;
    const tableUuid = args.tableUuid;
    const typeOptions = getTableOptions(model);
    
    const toolbar = DOM.create(Toolbar, {});
    const input = DOM.create(TextInput, { value: '', placeholder: 'Property name' });
    
    const typeSelect = Selector({
        options: [
            { value: String(1), label: 'String' },
            { value: String(2), label: 'Number' },
            { value: String(3), label: 'Boolean' },
            { value: String(42), label: 'Link' }
        ]
    });
    
    let targetSelect = null;
    
    typeSelect.on('changed', function(msg) {
        const type = Number(msg.value);
        if (type === 42 && !targetSelect) {
            targetSelect = Selector({ options: typeOptions });
            toolbar.add(targetSelect, { after: typeSelect });
        } else if (type !== 42 && targetSelect) {
            toolbar.remove(targetSelect);
            targetSelect = null;
        }
    });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', function() {
        const name = input.getValue().trim();
        const type = Number(typeSelect.getValue());
        
        if (!name) {
            toolbar.emit('close');
            return;
        }
        
        const table = model.getTable(tableUuid);
        if (!table) {
            toolbar.emit('close');
            return;
        }
        
        const spec = { name, type };
        if (type === 42 && targetSelect) {
            spec.targetTableUuid = targetSelect.getValue();
        }
        
        table.addColumn(spec);
        toolbar.emit('close', { name, type });
    });
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('clicked', function() {
        toolbar.emit('close');
    });
    
    toolbar.add(input);
    toolbar.add(typeSelect);
    toolbar.add(confirm);
    toolbar.add(cancel);
    
    return toolbar;
}

// DeletePropertyDialog - edit-mode dialog
function DeletePropertyDialog(args) {
    const model = args.model;
    const tableUuid = args.tableUuid;
    const table = model.getTable(tableUuid);
    const propertyOptions = table ? table.columns.map(col => ({
        value: col.colId,
        label: col.name
    })) : [];
    
    const toolbar = DOM.create(Toolbar, {});
    const label = DOM.create(Label, { text: 'Delete property:' });
    const select = Selector({ options: propertyOptions });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', function() {
        const colId = select.getValue();
        const t = model.getTable(tableUuid);
        if (t && colId) {
            t.removeColumn(colId);
            toolbar.emit('close', { colId });
        } else {
            toolbar.emit('close');
        }
    });
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('clicked', function() {
        toolbar.emit('close');
    });
    
    toolbar.add(label);
    toolbar.add(select);
    toolbar.add(confirm);
    toolbar.add(cancel);
    
    return toolbar;
}

// buildTree
function buildTree(model, tableUuid) {
    const treeView = DOM.create(TreeView, { itemClsid: TreeItem });
    if (!treeView) return null;
    
    const treeInterface = createTreeInterface(model, {});
    const { tree } = treeInterface.buildTree(tableUuid);
    
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

            console.log('   '.repeat(item.getDepth()), node.label);
            
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
    
    // Subscribe to row events for incremental updates
    const rootTable = model.getTable(tableUuid);
    
    rootTable.on('row.added', function(data) {
        const nameColumn = rootTable.columns.find(col => col.type === 1);
        const label = nameColumn ? data.rowData[nameColumn.colId] || `Row ${data.rowId}` : `Row ${data.rowId}`;
        
        treeView.select(null, true);
        const item = treeView.add({
            label: label,
            icon: '📄',
            type: 'folder',
            data: { tableUuid, rowId: data.rowId }
        });

        if (!firstItem) {
            firstItem = item;
            treeView.select(item);
        }
    });
    
    rootTable.on('row.deleted', function(data) {
        const selected = treeView.getSelected();
        if (selected) {
            const selectedData = selected.getData();
            if (selectedData && selectedData.rowId === data.rowId && selectedData.tableUuid === tableUuid) {
                treeView.remove(selected);
                treeView.select(null);
            }
        }
    });
    
    return { treeView, firstItem };
}

// buildProps
function buildProps(model, tableUuid, rowId) {
    const propView = DOM.create(PropertyView, {});
    if (!propView) return null;
    
    const table = model.getTable(tableUuid);
    if (!table) return propView;
    
    table.on('column.added', function(data) {
        const prop = { name: data.columnName, type: data.type, value: '' };
        if (data.type === 42) {
            prop.options = [];
        }
        propView.addProperty(prop);
    });
    
    table.on('column.removed', function(data) {
        propView.remove(data.columnName);
    });

    const row = rowId !== null && rowId !== undefined ? table.getRow(rowId) : null;
    
    table.columns.forEach(col => {
        const value = row ? row.data[col.colId] : '';
    
        const prop = {
            name: col.name,
            type: col.type,
            value: value
        };
        
        if (col.type === 42) {
            const targetTable = model.getTable(col.targetTableUuid);
            prop.options = targetTable ? targetTable.rows.map((row, i) => ({
                idx: row.id,
                name: row.data[targetTable.columns[0]?.colId] || `Row ${i}`
            })) : [];
        }
        
        propView.addProperty(prop);
    });
    
    return propView;
}

// Main compound
export default function ModelTreeEditor(model) {
    if (!model) {
        console.error('[ModelTreeEditor] Model is required');
        return null;
    }
    
    const mainTBS = DOM.create(TBS, { topHeight: 40 });
    const mainLR = DOM.create(LR, {});
    const mainToolbar = DOM.create(Toolbar, {});
    const editToggleBox = DOM.create(EditToggleBox, {
        centerLabel: 'Instance:',
        rightLabel: 'Property:'
    });
    
    // Type select dialog
    const typeSelectDialog = TypeSelectDialog({ model });
    
    // Handle table selection
    typeSelectDialog.on('table-selected', function(pkg) {
        const tableUuid = pkg.tableUuid;
        
        if (!tableUuid) {
            mainLR.setLeft(null);
            mainLR.setRight(null);
            return;
        }
        
        const result = buildTree(model, tableUuid);
        
        if (result) {
            result.treeView.on('item-selected', function(item) {
                const data = item ? item.getData() : null;
                typeSelectDialog.emit('node-selected', {
                    tableUuid: data ? data.tableUuid : null,
                    rowId: data ? data.rowId : null
                });
            });
            
            mainLR.setLeft(result.treeView);
            
            if (result.firstItem) {
                result.treeView.select(result.firstItem);
            } else {
                result.treeView.select(null);
            }
        }
        
        editToggleBox.setEdit('rename-type', RenameTypeDialog({ model, tableUuid }));
        editToggleBox.setEdit('delete-type', DeleteTypeDialog({ model, tableUuid }));
        editToggleBox.setEdit('add-instance', AddInstanceDialog({ model, tableUuid }));
    });
    
    // Handle node selection
    typeSelectDialog.on('node-selected', function(pkg) {
        const tableUuid = pkg.tableUuid || typeSelectDialog.getValue();
        const rowId = pkg.rowId;
        
        editToggleBox.setEdit('add-property', AddPropertyDialog({ model, tableUuid }));
        editToggleBox.setEdit('delete-property', DeletePropertyDialog({ model, tableUuid }));
        
        if (pkg.tableUuid && pkg.rowId !== null) {
            editToggleBox.setEdit('delete-instance', DeleteInstanceDialog({
                model,
                tableUuid: pkg.tableUuid,
                rowId: pkg.rowId
            }));
        }
        
        const propView = buildProps(model, tableUuid, rowId);
        mainLR.setRight(propView);
    });
    
    // Add toggles to EditToggleBox
    editToggleBox.add('type-select', 'left', typeSelectDialog, null);
    
    editToggleBox.add('add-type', 'left', 
        IdleButtonDialog('New'), 
        AddTypeDialog({ model }));
    
    editToggleBox.add('rename-type', 'left',
        IdleButtonDialog('Rename'),
        null);
    
    editToggleBox.add('delete-type', 'left',
        IdleButtonDialog('Delete'),
        null);
    
    editToggleBox.add('add-instance', 'center',
        IdleButtonDialog('New'),
        null);
    
    editToggleBox.add('delete-instance', 'center',
        IdleButtonDialog('Delete'),
        null);
    
    editToggleBox.add('add-property', 'right',
        IdleButtonDialog('New'),
        null);
    
    editToggleBox.add('delete-property', 'right',
        IdleButtonDialog('Delete'),
        null);
    
    // Assemble
    mainToolbar.add(editToggleBox);
    mainTBS.setTop(mainToolbar);
    mainTBS.setBottom(mainLR);
    
    // Initial state
    const tables = Array.from(model.tables.values());
    if (tables.length > 0) {
        typeSelectDialog.setValue(tables[0].uuid);
        typeSelectDialog.emit('changed', { value: tables[0].uuid });
    } else {
        typeSelectDialog.emit('changed', { value: null });
    }
    
    return mainTBS;
}
