// src/compounds/model-tree-editor.js

import { DomRegistry as DOM } from '../dom-registry.js';
import { buildTree } from '../shared/tree-utils.js';

import TBS from '../dom-comps/top-bottom-static.js';
import LR from '../dom-comps/left-right.js';
import TB from '../dom-comps/top-bottom.js';
import Toolbar from '../dom-comps/toolbar.js';
import SelectBox from '../dom-comps/select-box.js';
import Button from '../dom-comps/button.js';
import TextInput from '../dom-comps/text-input.js';
import Label from '../dom-comps/label.js';
import PropertyView from '../dom-comps/property-view.js';
import EditToggleBox from '../dom-comps/edit-toggle-box_focus-out.js';
import GridView from '../dom-comps/grid-view-sorting.js';

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

// RenameTypeDialog
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
        
        const spec = { name, type: null };
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

// buildProps
function buildProps(model, tableUuid, rowId) {
    const propView = DOM.create(PropertyView, {});
    if (!propView) return null;
    
    const table = model.getTable(tableUuid);
    if (!table) return propView;
    
    table.on('column-added', function(data) {
        const prop = { name: data.columnName, type: data.type, value: '' };
        if (data.type === 42) {
            prop.options = [];
        }
        propView.addProperty(prop);
    });
    
    table.on('column-removed', function(data) {
        propView.remove(data.columnName);
    });

    table.on('cell-changed', (data) => {
        if (data.rowId !== rowId) return;
        
        const column = table.forColumns(col => col.colId === data.colId);
        if (column) {
            propView.setProperty(column.name, data.newValue);
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
        
        propView.addProperty(prop);
    });
    
    propView.on('value-changed', (prop) => {
        table.setCell(prop.rowId, prop.colId, prop.value);
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
    const mainTB = DOM.create(TB, {});
    const mainLR = DOM.create(LR, {});
    const mainToolbar = DOM.create(Toolbar, {});
    const editToggleBox = DOM.create(EditToggleBox, {
        centerLabel: 'Instance:',
        rightLabel: 'Property:'
    });
    
    const typeSelectDialog = TypeSelectDialog({ model });
    
    // Table selection handler
    typeSelectDialog.on('table-selected', function(pkg) {
        const tableUuid = pkg.tableUuid;
        
        editToggleBox.closeActive();
        
        if (!tableUuid) {
            mainLR.setLeft(null);
            mainLR.setRight(null);
            return;
        }
        
        const result = buildTree(model, tableUuid);
        
        if (result) {
            const treeView = result.treeView;
            result.treeView.on('item-selected', function(item) {
                typeSelectDialog.emit('node-selected', {
                    treeView: result.treeView,
                    item: item
                });
            });
            
            result.treeView.on('item-deleted', function(item) {
                const data = item.getData();
                model.deleteRow(data.tableUuid, data.rowId, { cascade: false });
            });

            result.treeView.on('item-label-changed', function(pkg) {
                const data = pkg.item.getData();
                const table = model.getTable(data.tableUuid);
                if (!table) return;
                
                const nameColumn = table.forColumns(col => col.type === 1);
                if (nameColumn) {
                    table.setCell(data.rowId, nameColumn.colId, pkg.newLabel);
                }
            });            
            
            const rootTable = model.getTable(tableUuid);
            
            rootTable.on('row-added', function(data) {
                const nameColumn = rootTable.forColumns(col => col.type === 1);
                const label = nameColumn ? data.rowData[nameColumn.colId] || `Row ${data.rowId}` : `Row ${data.rowId}`;
                
                result.treeView.select(null, true);
                const item = result.treeView.add({
                    label: label,
                    icon: '📄',
                    type: 'folder',
                    data: { tableUuid, rowId: data.rowId }
                });
                
                if (!result.firstItem) {
                    result.firstItem = item;
                    treeView.select(item);
                }
            });
            
            rootTable.on('row-deleted', function(data) {
                const selected = result.treeView.getSelected();
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

                    if (column.type === 1) {
                        const item = result.treeView.find(it => {
                            const d = it.getData();
                            return d.tableUuid === data.tableUuid && d.rowId === data.rowId;
                        });
                        if (item) {
                            item.setLabel(data.newValue);
                        }
                        return;
                    }

                    if (!column || column.type !== 42) return;
                    
                    const item = result.treeView.find(it => {
                        const d = it.getData();
                        return d.tableUuid === table.uuid && d.rowId === data.rowId;
                    });
                    if (!item) return;
                    
                    const parent = result.treeView.getParent(item);
                    if (!parent) return;
                    
                    const parentData = parent.getData();
                    if (column.targetTableUuid !== parentData.tableUuid) return;
                    
                    const newParent = result.treeView.find(it => {
                        const d = it.getData();
                        return d.tableUuid === column.targetTableUuid && d.rowId === data.newValue;
                    }) || null;
                    
                    result.treeView.move(item, newParent);
                });
            }
            
            mainLR.setLeft(result.treeView);
            
            if (result.firstItem) {
                result.treeView.select(result.firstItem);
            } else {
                result.treeView.select(null);
            }
        }

        const gridView = DOM.create(GridView, {
            model: model,
            tableUuid: pkg.tableUuid
        });
        mainTB.setBottom(gridView);
        
        editToggleBox.setEdit('rename-type', RenameTypeDialog({ model, tableUuid }));
        editToggleBox.setEdit('delete-type', DeleteTypeDialog({ model, tableUuid }));
        editToggleBox.setEdit('add-instance', AddInstanceDialog({ model, tableUuid }));
    });
    
    // Node selection handler
    typeSelectDialog.on('node-selected', function(pkg) {
        const treeView = pkg.treeView;
        const item = pkg.item;
        
        editToggleBox.closeActive();
        
        const data = item ? item.getData() : null;
        const tableUuid = data ? data.tableUuid : typeSelectDialog.getValue();
        const rowId = data ? data.rowId : null;
        
        editToggleBox.setEdit('add-property', AddPropertyDialog({ model, tableUuid }));
        editToggleBox.setEdit('delete-property', DeletePropertyDialog({ model, tableUuid }));
        
        if (item) {
            editToggleBox.setEdit('delete-instance', DeleteInstanceDialog({
                treeView: treeView,
                selectedItem: item
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
    mainTBS.setTop(editToggleBox);
    mainTBS.setBottom(mainTB);
    mainTB.setTop(mainLR);
    
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
