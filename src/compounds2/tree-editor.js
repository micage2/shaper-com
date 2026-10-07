import { DomRegistry as DOM } from '../dom-registry.js';

import TBS from '../dom-comps/top-bottom-static.js';
import LR from '../dom-comps/left-right.js';
import TwoStateBox from '../dom-comps/two-state-box.js';
import TreeView from '../dom-comps/tree-view.js';
import TreeItem from '../dom-comps/tree-item.js';
import PropertyView from '../dom-comps/property-view.js';
import SelectBox from '../dom-comps/select-box.js';
import {
    buildTree as buildTreeView, 
} from '../shared/tree-utils-new.js';
import Dialog from '../compounds2/dialogs-tree.js';

const Selector = (options) => DOM.create(SelectBox, options);

export default function TreeEditor(db) {
    console.log('TODO:', '[TreeEditor]', 'check click-away of dialogs');

    const tbs = DOM.create(TBS, { topHeight: 40 });
    const toggleBar = DOM.create(TwoStateBox, {});
    const mainLR = DOM.create(LR, {});
    const treeView = DOM.create(TreeView, { itemClsid: TreeItem });
    const propView = DOM.create(PropertyView, { caption: '—' });
    
    mainLR.setLeft(treeView);
    mainLR.setRight(propView);
    
    tbs.setTop(toggleBar);
    tbs.setBottom(mainLR);

    let currentTreeView = null;
    let currentUuid = null;

    db.on('*', (msg) => {
        console.log('*', '[TreeEditor]', msg);
    })

    db.on('db-table-created', (type) => {
        console.log('TODO:', '[TreeEditor]', 'db-table-created', type);

        tbs.emit('type-created', type);
    });
    db.on('db-table-renamed', (type) => {
        console.log('TODO:', '[TreeEditor]', 'db-table-renamed', type);

        tbs.emit('type-renamed', type);
    });
    db.on('db-table-deleted', (table) => {
        console.log('TODO:', '[TreeEditor]', 'db-table-deleted');

        tbs.emit('type-deleted', table);
    });
    db.on('db-column-created', (col) => {
        console.log('TODO:', '[TreeEditor]', 'db-column-created');

        if (col.tableUuid !== currentUuid) return;
        tbs.emit('column-created', col);
    });
    db.on('db-column-deleted', (col) => {
        console.log('TODO:', '[TreeEditor]', 'db-column-deleted');

        if (col.tableUuid !== currentUuid) return;
        tbs.emit('prop-deleted', col);
    });
    db.on('db-row-created', (data) => {
        console.log('TODO:', '[TreeEditor]', 'db-row-created');

        if (!currentTreeView) return;
        if (data.tableUuid !== currentUuid) return;
        
        currentTreeView.add({
            label: data.label,
            icon: data.icon,
            type: 'folder',
            data: { tableUuid: data.tableUuid, rowId: data.rowId }
        });
    });
    db.on('db-row-deleted', (col) => {
        console.log('TODO:', '[TreeEditor]', 'db-row-deleted');

        if (col.tableUuid !== currentUuid) return;
        tbs.emit('instance-deleted', col);
    });
    db.on('db-cell-changed', (cell) => {
        console.log('TODO:', '[TreeEditor]', 'db-cell-changed');
    });

    const getLinks = () => db.forTables().map(t => ({
        value: t.uuid, label: t.name
    }));

    tbs.on('type-selected', (type) => {
        currentUuid = type.uuid;
        currentTreeView = buildTreeView(db, type.uuid);
        const firstTreeItem = currentTreeView.forItems(i => true);
        currentTreeView.select(firstTreeItem);
        mainLR.setLeft(currentTreeView);
        const propView = DOM.create(PropertyView, { caption: '—' });
        mainLR.setRight(propView);
    });
    tbs.on('type-created', (type) => {
        const hadSelection = !!typeSelector.getValue();
        typeSelector.addOption(type.name, type.uuid);
        if (!hadSelection) {
            tbs.emit('type-selected', type);
        }
    });

    const typeSelector = Selector(); // filled by table creation
    typeSelector.on('changed', (option) => {
        const tableUuid = option.value;
        const name = option.label;
        console.log('[typeSelector] -> changed', option);

        tbs.emit('type-selected', { uuid: tableUuid, name });
    });

    toggleBar.add('type-select', 'left', typeSelector, null);
    const iModel = {
        on: tbs.on,
    };
    toggleBar.add('add-type', 'left', Dialog.IdleButton('+ Type'), Dialog.AddTable(iModel));
    toggleBar.add('rename-type', 'left', Dialog.IdleButton('Edit'), Dialog.RenameTable(iModel));
    toggleBar.add('delete-type', 'left', Dialog.IdleButton('Delete'), Dialog.DeleteTable(iModel));

    // bootstrap, tbs listens, this selects and displays the first table
    db.forTables(type => tbs.emit('type-created', type));
    
    return tbs;
}