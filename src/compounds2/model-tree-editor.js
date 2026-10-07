// src/compounds/model-tree-editor-6.js

import { DomRegistry as DOM } from '../dom-registry.js';
import { buildTree, getTableIcon, addTreeNode } from '../shared/tree-utils-new.js';

import TBS from '../dom-comps/top-bottom-static.js';
import LR from '../dom-comps/left-right.js';
import SelectBox from '../dom-comps/select-box.js';
import TwoStateBox from '../dom-comps/two-state-box.js';
import Dialog from './dialogs-tree.js';
import PropertyView from '../dom-comps/property-view.js';
import SimpleView from '../dom-comps/simple-view.js';

const Selector = (options) => DOM.create(SelectBox, options);

function getInstanceOptions(db, tableUuid) {
    const nameCol = db.forColumns(tableUuid, col => col.name === 'name', 'one');

    const rows = db.getRows(tableUuid);
    const options = [];
    for(const row of rows) {
        options.push({ value: row.id, label: row.data[nameCol.id] });
    }

    return options;
};

function getTableName(db, tableUuid) {
    const tableInfo = db.getTableInfo(tableUuid);
    return tableInfo.name;
}

function buildPropertyView(db, tableUuid, rowId, unsubs) {
    for (const unsub of unsubs) unsub(); // unsubscribe

    const caption = getTableName(db, tableUuid);
    const propView = DOM.create(PropertyView, { caption });

    const row = db.getRow(tableUuid, rowId);

    for (const [colId, value] of Object.entries(row.data)) {
        const col = db.getColumn(tableUuid, colId);
        const options = col.targetTableUuid ? getInstanceOptions(db, col.targetTableUuid) : null;

        const prop = {
            value,
            options,
            type: col.type,
            name: col.name,
            colId: col.id,
            rowId,
        };
        propView.add(prop);
    }

    unsubs.push(propView.on('value-changed', (prop) => {
        // console.log('⚙️', '[MTE]', 'value-changed, validation?', prop);
        db.setCell(tableUuid, rowId, prop.colId, prop.value);
    }));

    return propView;
}

function buildTreeView(db, uuid, lr, unsubs) {        
    for (const unsub of unsubs) { unsub(); unsubs.length = 0; }

    const treeView = buildTree(db, uuid);
    const propertyViewUnsubs = [];

    // subscribtions to TreeView envents
    unsubs.push(treeView.on('item-selected', (item) => {
        // console.log('⚙️', '[MTE]', 'tree-item-selected', item);
        if (item) {
            const { rowId, tableUuid } = item.getData();
            const propertyView = buildPropertyView(db, tableUuid, rowId, propertyViewUnsubs);
            lr.setRight(propertyView);
            lr.emit('prop-view-changed', propertyView);
        }
        else {
            const simple = DOM.create(SimpleView, {title: `
                Create an instance.
            `});
            lr.setRight(simple);
        }
    }));

    unsubs.push(treeView.on('item-label-changed', ({ item, newLabel }) => {
        console.log('⚙️', '[MTE]', 'tree-item-changed', { item, newLabel });
        const {tableUuid, rowId} = item.getData();
        const nameCol = db.forColumns(tableUuid, c => c.name === 'name', 'one');
        db.setCell(tableUuid, rowId, nameCol.id, newLabel);
    }));

    unsubs.push(treeView.on('item-deleted', ({ item, newLabel }) => {
        console.log('⚙️', '[MTE]', 'tree-item-deleted', { item, newLabel });
    }));

    return treeView;
}

function findItem(treeview, tableUuid, rowId) {
    return treeview.forItems(i => {
        if (i.getData().tableUuid === tableUuid 
            && i.getData().rowId === rowId) return true
        return false;
    });
}

// Main compound
export default function ModelTreeEditor(model) {
    if (!model) {
        console.error('[ModelTreeEditor] Model is required');
        return null;
    }

    // Layout
    const rootTBS = DOM.create(TBS, { topHeight: 40 });
    const mainLR = DOM.create(LR, {});

    const twoStateBox = DOM.create(TwoStateBox);
    rootTBS.setTop(twoStateBox);
    rootTBS.setBottom(mainLR);

    let currentTreeView = null;
    const treeViewUnsubs = [];

    const typeSelector = Selector();
    typeSelector.on('changed', ({ value, label }) => {
        // console.log('⚙️', '[MTE]', 'type changed', { value, label });

        currentTreeView = buildTreeView(model, value, mainLR, treeViewUnsubs);
        mainLR.setLeft(currentTreeView);
        currentTreeView.select(currentTreeView.forItems(i => true)); // first item
        model.emit('type-selected', { uuid: value, name: label });
    });

    let currentPropertyView = null;
    mainLR.on('prop-view-changed', (propview) => currentPropertyView = propview);

    model.on('db-table-created', function (table) {
        console.info('💡', '[MTE]', 'db-table-created:', table.name);
        
        // add type to typeSelector
        typeSelector.addOptionObj({ value: table.uuid, label: table.name });
        // console.log('❓', '[MTE]', 'select table?', table.name);
    });

    model.on('db-table-renamed', function (table) {
        console.log('⚙️', '[MTE]', 'db-table-renamed', table);
    });

    model.on('db-table-deleted', function (table) {
        console.log('⚙️', '[MTE]', 'db-table-deleted', table);
    });

    model.on('db-row-created', function (row) {
        console.log('⚙️', '[MTE]', 'db-row-created', row);
        // add tree node into right parent node
        // if row has link colums take the first
        // if not it's not part of the tree

    });

    model.on('db-row-deleted', function (row) {
        console.log('⚙️', '[MTE]', 'db-row-deleted', row);
    });
    
    model.on('db-column-created', function (col) {
        console.info('💡', '[MTE]', 'db-column-created:', col.name);
        // if (!currentPropertyView) return;
        // if (typeSelector.getValue() === col.tableUuid)
        //     currentPropertyView.add(col);
    });

    model.on('db-column-renamed', function (col) {
        console.log('⚙️', '[MTE]', 'db-column-renamed', col);
    });

    model.on('db-column-deleted', function (col) {
        // console.log('⚙️', '[MTE]', 'db-column-deleted', col);
        currentPropertyView.remove(col.name);
    });

    model.on('db-cell-changed', (cell) => {
        // console.log('⚙️', '[MTE]', 'db-cell-changed', cell);
        if (!currentPropertyView) return;
        
        if (cell.targetTableUuid) {
            const selectedNode = currentTreeView.getSelected();
            const tableUuid = typeSelector.getValue();
            currentTreeView = buildTreeView(model, tableUuid, mainLR, treeViewUnsubs);
            mainLR.setLeft(currentTreeView);
            if (selectedNode) {
                const data = selectedNode.getData();
                const item = currentTreeView.forItems(i => {
                    if (i.getData().tableUuid === data.tableUuid 
                        && i.getData().rowId === data.rowId) return true
                    return false;
                });
                currentTreeView.select(item);
            }
        }
        else {
            // console.log('⚙️', '[MTE]', 'db-cell-changed, not a link', cell);
            // find treeitem that represents this cell
            const col = model.getColumn(cell.tableUuid, cell.colId);
            if (col.name === 'name') {
                const item = findItem(currentTreeView, cell.tableUuid, cell.rowId);
                if (item) item.setLabel(cell.newValue);
            }
        }

        currentPropertyView.set(cell.columnName, cell.newValue);
    });

    // Add TwoState toggles to TwoStateBox
    twoStateBox.add('type-select', 'left', typeSelector, null);
    twoStateBox.add('create-type', 'left', Dialog.IdleButton('+ Type'), Dialog.CreateType(model));
    twoStateBox.add('rename-type', 'left', Dialog.IdleButton('✏️'), Dialog.RenameType(model));
    twoStateBox.add('delete-type', 'left', Dialog.IdleButton('🗑'), Dialog.DeleteType(model));

    twoStateBox.add('create-property', 'center', Dialog.IdleButton('+ Property'), Dialog.CreateProperty(model));
    twoStateBox.add('rename-property', 'center', Dialog.IdleButton('✏️'), Dialog.RenameProperty(model));
    twoStateBox.add('delete-property', 'center', Dialog.IdleButton('🗑'), Dialog.DeleteProperty(model));
    
    twoStateBox.add('create-instance', 'right', Dialog.IdleButton('+ Instance'), Dialog.CreateInstance(model));
    twoStateBox.add('delete-instance', 'right', Dialog.IdleButton('🗑'), Dialog.DeleteInstance(model));

    // bootstrap after loading
    // model.replay();
    // const tables = model.forTables(t=>typeSelector.addOptionObj({
    //     label: t.name, value: t.uuid
    // }));
    model.forTables(t=>typeSelector.addOption(t.name, t.uuid));
    // const firstType = model.forTables(() => true, 'one');
    // const selected = typeSelector.getSelected();
    // typeSelector.emit('changed', { value: firstType.uuid, label: firstType.name });

    return rootTBS;
}
