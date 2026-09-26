import { DomRegistry as DOM } from '../dom-registry.js';

import TBS from '../dom-comps/top-bottom-static.js';
import ToggleBar from '../dom-comps/two-state-box.js';
import SimpleView from '../dom-comps/simple-view.js';
import TableViewId from '../dom-comps/table-view.js';
import Dialog from '../compounds2/dialogs.js';
import SelectBox from '../dom-comps/select-box.js';


const TableView = (hub, options) => DOM.create(TableViewId, { hub, options });
const Selector = (options) => DOM.create(SelectBox, options);

export default function TableEditor(db) {
    let currentUuid = null;
    let currentTableView = null;

    const tbs = DOM.create(TBS, { topHeight: 40 });
    const toggleBar = DOM.create(ToggleBar, {});

    tbs.setTop(toggleBar);

    // database events, forward to child views
    db.on('db-table-created', (table) => tbs.emit('table-created', table));
    db.on('db-table-renamed', (table) => tbs.emit('table-renamed', table));
    db.on('db-table-deleted', (table) => tbs.emit('table-deleted', table));

    db.on('db-column-created', (col) => {
        if (col.tableUuid !== currentUuid) return;
        tbs.emit('column-created', col);
    });

    db.on('db-column-deleted', (col) => {
        if (col.tableUuid !== currentUuid) return;
        tbs.emit('column-deleted', col);
    });
    
    db.on('db-row-created', (row) => {
        if (row.tableUuid !== currentUuid) return;
        tbs.emit('row-created', row);
    });

    db.on('db-row-deleted', (row) => {
        if (row.tableUuid !== currentUuid) return;
        tbs.emit('row-deleted', row);
    });

    db.on('db-cell-changed', (cell) => {
        if (cell.tableUuid !== currentUuid) return;
        tbs.emit('cell-changed', cell);
    });

    const getLinks = () => db.forTables().map(t => ({
        value: t.uuid, label: t.name
    }));

    // from closure: tbs, currentTableView
    function showEmptyView() {
        currentUuid = null;
        currentTableView = null;
        tbs.setBottom(DOM.create(SimpleView, { title: 'Please add a table.' }));
    }

    // from closure: tbs, currentTableView
    function showTableView(tableUuid, tableOptions) {
        currentUuid = tableUuid;

        const iTable = {
            on: tbs.on,
            getRowNames: (uuid) => db.forRows(uuid),
            doTheClick: () => { 
                console.log('=======>>>  doTheClick');                
            },
            setCell: (colId, rowId, value) => db.setCell(currentUuid, rowId, colId, value),
        }
        if (currentTableView) {
            currentTableView.unsubscribe(); // VERY important !!!
        }
        currentTableView = TableView(iTable, { title: 'Table' });
        tbs.setBottom(currentTableView);

        const columns = db.getColumns(tableUuid);
        for (const col of columns) {
            tbs.emit('column-created', col);
        }

        const rows = db.getRows(tableUuid);
        for (const row of rows) {
            tbs.emit('row-created', row);
        }
    }

    // dialog interfaces
    const iModel = {
        on: tbs.on,
        createTable: (name) => db.createTable(name),
        renameTable: (tableUuid, newName) => db.renameTable(tableUuid, newName),
        deleteTable: tableUuid => db.deleteTable(tableUuid),
    };

    const iRow = {
        on: tbs.on.bind(tbs),
        create: (currentTableUuid, { name }) => db.createRow(currentTableUuid, {name}),
    };

    const iProperty = {
        on: tbs.on,
        createColumn: (tableUuid, args) => db.createColumn(tableUuid, args),
        deleteColumn: (tableUuid, colId) => db.deleteColumn(tableUuid, colId),
        getLinks,
        getTableProperties: (tableUuid) => {
            const options = db.forColumns(tableUuid);
            return options.map(col => ({
                value: col.id, label: col.name
            }));
        }
    };

    const tableSelector = Selector(); // filled by table creation
    tableSelector.on('changed', (option) => {
        const tableUuid = option.value;
        const name = option.label;
        console.log('[tableSelector] -> changed', option);

        tbs.emit('table-selected', { uuid: tableUuid, name });
        showTableView(tableUuid, getLinks());
    });
    tbs.on('table-created', (table) => {
        const hadSelection = !!tableSelector.getValue();
        tableSelector.addOption(table.name, table.uuid);
        if (!hadSelection) {
            tbs.emit('table-selected', table);
            showTableView(table.uuid, getLinks());
        }
    });
    tbs.on('table-renamed', (table) => {
        tableSelector.setLabel(table.uuid, table.name);
    });
    tbs.on('table-deleted', (table) => {
        const oldTableUuid = tableSelector.getValue();
        tableSelector.removeOption(table.uuid);

        if (table.uuid === oldTableUuid) {
            const options = getLinks();
            if (options.length > 0) {
                showTableView(options[0].value, options);
            } else {
                showEmptyView();
            }
        }

        const currentTableUuid = tableSelector.getValue();
        tbs.emit('table-selected', { uuid: currentTableUuid });
    });

    // add dialogs to ToggleBar
    // toggleBar.add('type-select', 'left', typeSelect, null);
    toggleBar.add('type-select', 'left', tableSelector, null);

    toggleBar.add('add-type', 'left', Dialog.IdleButton('+ Table'), Dialog.AddTable(iModel));
    toggleBar.add('rename-type', 'left', Dialog.IdleButton('Edit'), Dialog.RenameTable(iModel));
    toggleBar.add('delete-type', 'left', Dialog.IdleButton('Delete'), Dialog.DeleteTable(iModel));

    toggleBar.add('add-row', 'center', Dialog.IdleButton('+ Row'), Dialog.AddRow(iRow));
    toggleBar.add('delete-row', 'center', Dialog.IdleButton('Delete'), Dialog.DeleteRow(iRow));

    toggleBar.add('add-property', 'right', Dialog.IdleButton('+ Column'), Dialog.AddColumn(iProperty));
    toggleBar.add('delete-property', 'right', Dialog.IdleButton('Delete'), Dialog.DeleteColumn(iProperty));

    // bootstrap, TypeSelect listens, this selects and displays the first table
    db.forTables(table => tbs.emit('table-created', table));

    // const ret = db.forTables(table => {
    //     return table.name[0] === 'C';   
    // }, 'all');
    // console.log("forTable(): returns all cities starting with 'C'", ret);        

    return tbs;
}
