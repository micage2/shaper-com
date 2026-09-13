// src/compounds/model-tree-editor.js

import { DomRegistry as DOM } from '../dom-registry.js';
import { buildTree, getTableIcon, addTreeNode } from '../shared/tree-utils.js';

import TBS from '../dom-comps/top-bottom-static.js';
import LR from '../dom-comps/left-right.js';
import TB from '../dom-comps/top-bottom.js';
import Toolbar from '../dom-comps/toolbar.js';
import SelectBox from '../dom-comps/select-box.js';
import Button from '../dom-comps/button.js';
import TextInput from '../dom-comps/text-input.js';
import Label from '../dom-comps/label.js';
import PropertyView from '../dom-comps/property-view.js';
import TwoStateBox from '../dom-comps/two-state-box.js';
import GridView from '../dom-comps/grid-view.js';

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
    
    model.on('table-created', function(data) {
        select.addOption(data.name, data.uuid);
    });
    
    model.on('table-renamed', function(data) {
        select.setLabel(data.uuid, data.newName);
    });
    
    model.on('table-deleted', function(data) {
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

// AddTypeDialog
function AddTypeDialog(args) {
    const model = args.model;
    const toolbar = DOM.create(Toolbar, {});
    const label = DOM.create(Label, { text: `Create Type:` });
    const input = DOM.create(TextInput, { value: '', placeholder: 'Type name' });
    input.focus();
    
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
    
    toolbar.add(label);
    toolbar.add(input);
    toolbar.add(confirm);
    toolbar.add(cancel);

    toolbar.on('mounted', () => {
        input.focus();
    });

    return toolbar;
}

// RenameTypeDialog
function RenameTypeDialog(args) {
    const model = args.model;
    const tableUuid = args.tableUuid;
    const toolbar = DOM.create(Toolbar, {});
    const label = DOM.create(Label, { text: `Rename Type:` });

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
    
    toolbar.add(label);
    toolbar.add(input);
    toolbar.add(confirm);
    toolbar.add(cancel);
    
    toolbar.on('mounted', () => {
        input.focus();
    });

    return toolbar;
}

// DeleteTypeDialog
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

// AddInstanceDialog
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
        
        const nameColumn = table.forColumns(col => col.type === 1);
        if (nameColumn && name) {
            rowData[nameColumn.colId] = name;
        }
        
        const row = model.addRow(tableUuid, rowData);
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
    
    toolbar.on('mounted', () => {
        input.focus();
    });

    return toolbar;
}

// DeleteInstanceDialog
function DeleteInstanceDialog(args) {
    const treeView = args.treeView;
    const selectedItem = args.selectedItem;
    
    const toolbar = DOM.create(Toolbar, {});
    const label = DOM.create(Label, { text: 'Delete instance?' });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', function() {
        treeView.remove(selectedItem);
        toolbar.emit('close');
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

// AddPropertyDialog
function AddPropertyDialog(args) {
    const model = args.model;
    const tableUuid = args.tableUuid;
    
    const allTables = Array.from(model.tables.values());
    const linkTargets = [];
    
    for (const t of allTables) {
        let hasRows = false;
        t.forRows(() => { hasRows = true; return true; });
        if (hasRows) {
            linkTargets.push({ value: t.uuid, label: t.name });
        }
    }
    
    const toolbar = DOM.create(Toolbar, {});
    const input = DOM.create(TextInput, { value: '', placeholder: 'Property name' });
    
    const typeSelectOptions = [
        { value: String(1), label: 'String' },
        { value: String(2), label: 'Number' },
        { value: String(3), label: 'Boolean' }
    ];
    
    if (linkTargets.length > 0) {
        typeSelectOptions.push({ value: String(42), label: 'Link' });
    }
    
    const typeSelect = Selector({ options: typeSelectOptions });
    
    let targetSelect = null;
    
    typeSelect.on('changed', function(msg) {
        const type = Number(msg.value);
        if (type === 42 && !targetSelect) {
            targetSelect = Selector({ options: linkTargets });
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
        
        model.addColumn(tableUuid, spec);
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
    
    toolbar.on('mounted', () => {
        input.focus();
    });

    return toolbar;
}

// DeletePropertyDialog
function DeletePropertyDialog(args) {
    const model = args.model;
    const tableUuid = args.tableUuid;
    const table = model.getTable(tableUuid);
    const propertyOptions = [];
    
    if (table) {
        table.forColumns(col => {
            propertyOptions.push({
                value: col.colId,
                label: col.name
            });
        });
    }
    
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

// creates a PropertyView and wires model and view listeners
// returns IPropertyView instance
function buildProps(model, tableUuid, rowId) {
    const table = model.getTable(tableUuid);
    if (!table) return DOM.create(PropertyView, { caption: "No table selected" });
    
    const propView = DOM.create(PropertyView, { caption: table.name });
    
    table.on('column-added', function(data) {
        if (data.tableUuid !== tableUuid) return;
        
        const col = table.forColumns(c => c.colId === data.colId);
        if (!col) return;
        
        const value = row ? row.data[col.colId] : '';
        
        const prop = {
            tableUuid: data.tableUuid,
            colId: col.colId,
            rowId: rowId,
            name: col.name,
            type: col.type,
            value: value,
            options: null
        };
        
        if (col.type === 42) {
            const targetTable = model.getTable(col.targetTableUuid);
            prop.options = [];
            if (targetTable) {
                targetTable.forRows((targetRow) => {
                    const nameCol = targetTable.forColumns(c => c.type === 1);
                    prop.options.push({
                        idx: targetRow.id,
                        name: nameCol ? targetRow.data[nameCol.colId] || `Row ${targetRow.id}` : `Row ${targetRow.id}`
                    });
                });
            }
        }
        
        propView.add(prop);
    });

    table.on('column-removed', function(data) {
        propView.remove(data.columnName);
    });

    table.on('cell-changed', (data) => {
        if (data.rowId !== rowId) return;
        
        const column = table.forColumns(col => col.colId === data.colId);
        if (column) {
            propView.set(column.name, data.newValue);
        }
    });
    
    const row = rowId !== null && rowId !== undefined ? table.getRow(rowId) : null;
    
    table.forColumns(col => {
        const value = row ? row.data[col.colId] : '';
        
        const prop = {
            colId: col.colId,
            rowId,
            name: col.name,
            type: col.type,
            value: value,
            options: null
        };
        
        if (col.type === 42) {
            const targetTable = model.getTable(col.targetTableUuid);
            prop.options = [];
            if (targetTable) {
                targetTable.forRows(targetRow => {
                    prop.options.push({
                        idx: targetRow.id,
                        name: targetRow.data[targetTable.forColumns(c => c.type === 1)?.colId] || `Row ${targetRow.id}`
                    });
                });
            }
        }
        
        propView.add(prop);
    });
    
    propView.on('value-changed', (prop) => {
        table.setCell(prop.rowId, prop.colId, prop.value);
    });

    propView.on('unmount', () => {
        console.log('unmount', propView);        
    });
    
    return propView;
}

// Main compound
export default function ModelTreeEditor(model) {
    if (!model) {
        console.error('[ModelTreeEditor] Model is required');
        return null;
    }
    
    // Layout
    const rootTBS = DOM.create(TBS, { topHeight: 40 });
    const appToolbar = DOM.create(Toolbar, {});
    
    const mainTB = DOM.create(TB, {});
    const mainLR = DOM.create(LR, {});
    
    const bottomTBS = DOM.create(TBS, { topHeight: 40 });
    const twoStateBox = DOM.create(TwoStateBox, {
        centerLabel: 'Instance:',
        rightLabel: 'Property:'
    });
    
    const typeSelectDialog = TypeSelectDialog({ model });
    
    // Table selection handler
    typeSelectDialog.on('table-selected', function(pkg) {
        const tableUuid = pkg.tableUuid;
        
        twoStateBox.closeActive();
        
        if (!tableUuid) {
            mainLR.setLeft(null);
            mainLR.setRight(null);
            bottomTBS.setBottom(null);
            return;
        }
        
        const treeView = buildTree(model, tableUuid);
        
        if (treeView) {
            treeView.on('item-selected', function(item) {
                typeSelectDialog.emit('node-selected', { treeView, item });
            });
            
            treeView.on('item-deleted', function(item) {
                const data = item.getData();
                model.deleteRow(data.tableUuid, data.rowId, { cascade: false });
            });

            treeView.on('item-label-changed', function(pkg) {
                const data = pkg.item.getData();
                const table = model.getTable(data.tableUuid);
                if (!table) return;
                
                const nameColumn = table.forColumns(col => col.type === 1);
                if (nameColumn) {
                    table.setCell(data.rowId, nameColumn.colId, pkg.newLabel);
                }
            });
            
            const rootTable = model.getTable(tableUuid);
            
            rootTable.on('row-added', function(row) {
                const item = addTreeNode(model, treeView, row, null);
                if (!treeView.getSelected()) {
                    treeView.select(item);
                }
            });
            
            rootTable.on('row-deleted', function(data) {
                const selected = treeView.getSelected();
                if (selected) {
                    const selectedData = selected.getData();
                    if (selectedData && selectedData.rowId === data.rowId && selectedData.tableUuid === tableUuid) {
                        treeView.remove(selected);
                        treeView.select(null);
                    }
                }
            });
            
            for (const table of model.tables.values()) {
                table.on('row-deleted', function(data) {
                    const item = treeView.find(it => {
                        const d = it.getData();
                        return d.tableUuid === data.tableUuid && d.rowId === data.rowId;
                    });
                    if (item) {
                        treeView.remove(item);
                    }
                });

                table.on('cell-changed', function(data) {
                    if (data.oldValue === data.newValue) return;
                    const column = table.forColumns(col => col.colId === data.colId);

                    if (column && column.type === 1) {
                        const item = treeView.find(it => {
                            const d = it.getData();
                            return d.tableUuid === data.tableUuid && d.rowId === data.rowId;
                        });
                        if (item) {
                            item.setLabel(data.newValue);
                        }
                        return;
                    }

                    if (!column || column.type !== 42) return;
                    
                    const item = treeView.find(it => {
                        const d = it.getData();
                        return d.tableUuid === table.uuid && d.rowId === data.rowId;
                    });
                    if (!item) return;
                    
                    const parent = treeView.getParent(item);
                    if (!parent) return;
                    
                    const parentData = parent.getData();
                    if (column.targetTableUuid !== parentData.tableUuid) return;
                    
                    const newParent = treeView.find(it => {
                        const d = it.getData();
                        return d.tableUuid === column.targetTableUuid && d.rowId === data.newValue;
                    }) || null;
                    
                    treeView.move(item, newParent);
                });
            }
            
            mainLR.setLeft(treeView);
            treeView.select(treeView.forItems(() => true));
        }

        const gridView = DOM.create(GridView, {
            model: model,
            tableUuid: pkg.tableUuid
        });
        bottomTBS.setBottom(gridView);
        
        twoStateBox.setEdit('rename-type', RenameTypeDialog({ model, tableUuid }));
        twoStateBox.setEdit('delete-type', DeleteTypeDialog({ model, tableUuid }));
        twoStateBox.setEdit('add-instance', AddInstanceDialog({ model, tableUuid }));
    });
    
    // Node selection handler
    typeSelectDialog.on('node-selected', function(pkg) {
        const treeView = pkg.treeView;
        const item = pkg.item;
        
        twoStateBox.closeActive();
        
        const data = item ? item.getData() : null;
        const tableUuid = data ? data.tableUuid : typeSelectDialog.getValue();
        const rowId = data ? data.rowId : null;
        
        twoStateBox.setEdit('add-property', AddPropertyDialog({ model, tableUuid }));
        twoStateBox.setEdit('delete-property', DeletePropertyDialog({ model, tableUuid }));
        
        if (item) {
            twoStateBox.setEdit('delete-instance', DeleteInstanceDialog({
                treeView: treeView,
                selectedItem: item
            }));
        }
        
        const propView = buildProps(model, tableUuid, rowId);
        mainLR.setRight(propView);
    });
    
    // Add toggles to TwoStateBox
    twoStateBox.add('type-select', 'left', typeSelectDialog, null);
    twoStateBox.add('add-type', 'left', IdleButtonDialog('+ Type'), AddTypeDialog({ model }));
    twoStateBox.add('rename-type', 'left', IdleButtonDialog('Rename'), null);
    twoStateBox.add('delete-type', 'left', IdleButtonDialog('Delete'), null);
    twoStateBox.add('add-instance', 'center', IdleButtonDialog('+ Instance'), null);
    twoStateBox.add('delete-instance', 'center', IdleButtonDialog('Delete'), null);
    twoStateBox.add('add-property', 'right', IdleButtonDialog('+ Property'), null);
    twoStateBox.add('delete-property', 'right', IdleButtonDialog('Delete'), null);
    
    // Assemble layout
    mainTB.setTop(mainLR);
    mainTB.setBottom(bottomTBS);
    
    bottomTBS.setTop(twoStateBox);
    
    rootTBS.setTop(appToolbar);
    rootTBS.setBottom(mainTB);
    
    // Initial state
    const tables = Array.from(model.tables.values());
    if (tables.length > 0) {
        typeSelectDialog.setValue(tables[0].uuid);
        typeSelectDialog.emit('changed', { value: tables[0].uuid });
    } else {
        typeSelectDialog.emit('changed', { value: null });
    }
    
    return rootTBS;
}