import { DomRegistry as DOM } from '../dom-registry.js';
import { Mediator } from '../shared/mediator.js';
import {
    buildTree as buildTreeView, 
    getRowLabel, 
    getTableIcon
} from '../shared/tree-utils-new.js';
import TBS from '../dom-comps/top-bottom-static.js';
import TB from '../dom-comps/top-bottom.js';
import Toolbar from '../dom-comps/toolbar.js';
import Dialog from './dialogs.js';

// child compounds
import TwoStateBox from '../dom-comps/two-state-box.js';
import TreeEditor from './tree-editor.js';
import GridEditor from './grid-editor.js';

// root compound
export default function ModelEditor(model) {
    if (!model) {
        console.error('[ModelEditor] model is required');
        return null;
    }
    
    // Layout
    const rootTBS = DOM.create(TBS, { topHeight: 40 });
    const appToolbar = DOM.create(Toolbar, {});
    
    const mainTB = DOM.create(TB, {});
    const bottomTBS = DOM.create(TBS, { topHeight: 40 });
    const twoStateBox = DOM.create(TwoStateBox, {});
    
    // Model subscriptions → hub events
    model.on('db-table-created', (data) => {
        console.log('[ModelEditor] table-added:', data);
        rootTBS.emit('table-created', { tableUuid: data.tableUuid, name: data.name });
    });
    
    model.on('db-table-deleted', (data) => {
        rootTBS.emit('table-removed', { tableUuid: data.tableUuid });
    });
    
    model.on('db-table-renamed', (data) => {
        rootTBS.emit('table-renamed', { tableUuid: data.tableUuid, name: data.newName });
    });
    
    model.on('db-column-added', (data) => {
        console.log('[ModelEditor] column-added:', data);
    });
    
    model.on('db-column-removed', (data) => {
        console.log('[ModelEditor] column-removed:', data);
    });
    
    model.on('db-row-added', (data) => {
        const label = getRowLabel(model, data.tableUuid, data.rowId);
        const icon = getTableIcon(model, data.tableUuid);
        rootTBS.emit('row-added', {
            tableUuid: data.tableUuid, 
            rowId: data.rowId, 
            label, 
            icon
        });
    });
    
    model.on('db-row-deleted', (data) => {
        console.log('[ModelEditor] row-deleted:', data);
    });
    
    model.on('db-cell-changed', (data) => {
        console.log('[ModelEditor] cell-changed:', data);
    });

    // Interfaces for children, bind() is necessary!
    const iTree = {
        on: rootTBS.on.bind(rootTBS),
        buildTree: (tableUuid) => buildTreeView(model, tableUuid)
    };
    
    const iGrid = {
        on: rootTBS.on.bind(rootTBS)
    };
    
    const iTable = {
        on: rootTBS.on.bind(rootTBS),
        create: (name) => model.createTable(name),
        rename: (uuid, newName) => model.renameTable(uuid, newName),
        delete: (uuid) => model.deleteTable(uuid)
    };
    
    const iInstance = {
        on: rootTBS.on.bind(rootTBS),
        create: (tableUuid, rowData) => {
            if (tableUuid) model.createRow(tableUuid, rowData);
        },
        delete: (rowId) => {
            const tableUuid = typeSelect.getValue();
            if (tableUuid) model.deleteRow(tableUuid, rowId);
        }
    };
    
    const iProperty = {
        on: rootTBS.on.bind(rootTBS),
        create: (spec) => {
            const tableUuid = typeSelect.getValue();
            if (tableUuid) model.createColumn(tableUuid, spec);
        },
        delete: (colId) => {
            const tableUuid = typeSelect.getValue();
            if (tableUuid) model.deleteColumn(tableUuid, colId);
        }
    };

    const iJustListen = { on: rootTBS.on.bind(rootTBS) };

    // Wire type selector selection to hub
    const typeSelect = Dialog.TypeSelect(iJustListen);
    typeSelect.on('table-changed', (msg) => {
        console.log('[ModelEditor] table-selected', msg.value);        
        rootTBS.emit('table-changed', { tableUuid: msg.value });
    });

    typeSelect.on('table-selected', (msg) => {
        rootTBS.emit('table-changed', { tableUuid: msg.tableUuid });
    });
        
    const treeEditor = TreeEditor(iTree);
    const gridEditor = GridEditor(iGrid);

    // put compounds in layout
    bottomTBS.setTop(twoStateBox);
    bottomTBS.setBottom(gridEditor);
    
    mainTB.setTop(treeEditor);
    mainTB.setBottom(bottomTBS);
    
    rootTBS.setTop(appToolbar);
    rootTBS.setBottom(mainTB);

    // add dialogs to toggle bar (better name: ToogleBar)
    twoStateBox.add('type-select', 'left', typeSelect, null);
    twoStateBox.add('add-type', 'left', Dialog.IdleButton('+ Type'), Dialog.AddType(iTable));
    twoStateBox.add('rename-type', 'left', Dialog.IdleButton('Rename'), Dialog.RenameType(iTable));
    twoStateBox.add('delete-type', 'left', Dialog.IdleButton('Delete'), Dialog.DeleteType(iTable));
    twoStateBox.add('add-instance', 'center', Dialog.IdleButton('+ Instance'), Dialog.AddInstance(iInstance));
    twoStateBox.add('delete-instance', 'center', Dialog.IdleButton('Delete'), Dialog.DeleteInstance(iInstance));
    twoStateBox.add('add-property', 'right', Dialog.IdleButton('+ Property'), Dialog.AddProperty(iProperty));
    twoStateBox.add('delete-property', 'right', Dialog.IdleButton('Delete'), Dialog.DeleteProperty(iProperty));
    
    return rootTBS;
}
