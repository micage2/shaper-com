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
    unsubs.length = 0;

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
            tableUuid
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
            lr.emit('node-selected', { rowId, tableUuid });
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
export default function ModelTreeEditor(model, unsubs) {
    if (!model) {
        console.error('[ModelTreeEditor] Model is required');
        return null;
    }

    for (const unsub of unsubs) { unsub(); }
    unsubs.length = 0;

    // Layout
    const rootTBS = DOM.create(TBS, { topHeight: 40 });
    const mainLR = DOM.create(LR, {});

    const twoStateBox = DOM.create(TwoStateBox);
    rootTBS.setTop(twoStateBox);
    rootTBS.setBottom(mainLR);

    let currentTreeView = null;
    const views = { tree: null, props: null };
    const treeViewUnsubs = [];

    const typeSelector = Selector();
    unsubs.push(typeSelector.on('changed', ({ value, label }) => {
        // console.log('⚙️', '[MTE]', 'type changed', { value, label });

        currentTreeView = buildTreeView(model, value, mainLR, treeViewUnsubs);
        mainLR.setLeft(currentTreeView);
        currentTreeView.select(currentTreeView.forItems(i => true)); // first item
        model.emit('type-selected', { uuid: value, name: label });
        mainLR.emit('type-selected', { uuid: value, name: label });
    }));

    let currentPropertyView = null;
    unsubs.push(mainLR.on('prop-view-changed', (propview) => currentPropertyView = propview));

    unsubs.push(model.on('db-table-created', function (table) {
        console.info('💡', '[MTE]', 'db-table-created:', table.name);
        
        // add type to typeSelector
        typeSelector.addOptionObj({ value: table.uuid, label: table.name });
        // console.log('❓', '[MTE]', 'select table?', table.name);
    }));

    unsubs.push(model.on('db-table-renamed', function (table) {
        console.log('⚙️', '[MTE]', 'db-table-renamed', table);
    }));

    unsubs.push(model.on('db-table-deleted', function (table) {
        console.log('⚙️', '[MTE]', 'db-table-deleted', table);
    }));

    unsubs.push(model.on('db-row-created', function (row) {
        console.log('⚙️', '[MTE]', 'db-row-created', row);
        if (!currentTreeView) return;

        const item = addTreeNode(model, currentTreeView, {
            tableUuid: row.tableUuid, rowId: row.id
        }, null); // no parent

        // currentTreeView.emit('item-selected', item);
        currentTreeView.select(item);
    }));

    unsubs.push(model.on('db-row-deleted', function (row) {
        console.log('⚙️', '[MTE]', 'db-row-deleted', row);
    }));
    
    unsubs.push(model.on('db-column-created', function (col) {
        console.info('💡', '[MTE]', 'db-column-created:', col.name);
        if (!currentPropertyView) return;
        currentPropertyView.add(col);
    }));

    unsubs.push(model.on('db-column-renamed', function (col) {
        console.log('⚙️', '[MTE]', 'db-column-renamed', col);

        if(currentPropertyView) {
            currentPropertyView.rename(col);
        }
    }));

    unsubs.push(model.on('db-column-deleted', function (col) {
        // console.log('⚙️', '[MTE]', 'db-column-deleted', col);
        currentPropertyView.remove(col.name);
    }));

    unsubs.push(model.on('db-cell-changed', (cell) => {
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
            console.log('⚙️', '[MTE]', 'db-cell-changed, not a link', cell);
            console.log('⚙️', 'update field, use set(cell.colId, cell.newValue)', cell);
            // find treeitem that represents this cell
            const col = model.getColumn(cell.tableUuid, cell.colId);
            if (col.name === 'name') {
                const item = findItem(currentTreeView, cell.tableUuid, cell.rowId);
                if (item) item.setLabel(cell.newValue);
            }
            else {
                currentPropertyView.set(cell.colId, cell.newValue);
            }
        }

        // currentPropertyView.set(cell.colId, cell.newValue);
    }));

    const iface = {
        on: mainLR.on,
        createColumn: model.createColumn,
        getLinkOptions: () => model.forTables().map(t => ({
            value: t.uuid, label: t.name
        })),
    };

    // Add TwoState toggles to TwoStateBox
    twoStateBox.add('type-select', 'left', typeSelector, null);
    twoStateBox.add('create-type', 'left', Dialog.IdleButton('+ Type'), Dialog.CreateType(model));
    twoStateBox.add('rename-type', 'left', Dialog.IdleButton('✏️'), Dialog.RenameType(model));
    twoStateBox.add('delete-type', 'left', Dialog.IdleButton('🗑'), Dialog.DeleteType(model));

    twoStateBox.add('create-property', 'center', Dialog.IdleButton('+ Property'), Dialog.CreateProperty(iface));
    twoStateBox.add('rename-property', 'center', Dialog.IdleButton('✏️'), Dialog.RenameProperty(model));
    twoStateBox.add('delete-property', 'center', Dialog.IdleButton('🗑'), Dialog.DeleteProperty(model));
    
    twoStateBox.add('create-instance', 'right', Dialog.IdleButton('+ Instance'), Dialog.CreateInstance(model));
    twoStateBox.add('delete-instance', 'right', Dialog.IdleButton('🗑'), Dialog.DeleteInstance(model));

    // bootstrap after loading
    model.forTables(t=>typeSelector.addOption(t.name, t.uuid));

    return rootTBS;
}
