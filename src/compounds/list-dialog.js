import { DomRegistry as DOM } from '../dom-registry.js';
import ListView from '../dom-comps/list-view.js';
import TreeItemX from '../dom-comps/tree-item-x.js';
import EditToggle from '../dom-comps/edit-toggle.js';
import EditToggleBox from '../dom-comps/edit-toggle-box.js';
import TopBottomStatic from '../dom-comps/top-bottom-static.js';
import { createTreeInterface } from '../shared/model2tree.js';

const $$ = DOM.create;
const List = (iListData) => $$(ListView, iListData);

function createListDialog(model, parentData, config = {}) {
    const treeIface = createTreeInterface(model, config);
    
    const listView = List({ itemClsid: TreeItemX });
    
    if (parentData) {
        const children = treeIface.getChildren(parentData.tableUuid, parentData.rowId);
        for (const childData of children) {
            listView.add(childData);
        }
    }
    
    listView.on('item-delete-clicked', (item) => {
        const data = item.getData();
        if (data) {
            const table = model.getTable(data.tableUuid);
            table.deleteRow(data.rowId);
            if (config.onInstanceDeleted) {
                config.onInstanceDeleted();
            }
        }
    });
    
    const childTypes = [];
    if (parentData) {
        for (const table of model.tables.values()) {
            for (const column of table.columns) {
                if (column.type === 42 && column.targetTableUuid === parentData.tableUuid) {
                    childTypes.push({ uuid: table.uuid, name: table.name });
                    break;
                }
            }
        }
    }
    
    const box = $$(EditToggleBox);
    
    const addInstanceToggle = $$(EditToggle, {
        idleLabel: '+ Instance',
        editLabel: 'Add Instance',
        editChildren: [
            { type: 'input', name: 'name', placeholder: 'instance name' },
            { 
                type: 'select',
                name: 'type',
                options: childTypes.map(t => ({ value: t.uuid, label: t.name }))
            },
            { type: 'button', label: 'Ok', action: 'ok' },
            { type: 'button', label: 'Cancel', action: 'cancel' }
        ],
        onfinish: (confirmed, values) => {
            if (confirmed && values.name && values.type) {
                const childTable = model.getTable(values.type);
                const linkColumn = childTable.columns.find(col => 
                    col.type === 42 && col.targetTableUuid === parentData.tableUuid
                );
                
                const rowData = {};
                rowData[linkColumn.colId] = parentData.rowId;
                
                const nameColumn = childTable.columns.find(col => col.name === 'name');
                if (nameColumn) {
                    rowData[nameColumn.colId] = values.name;
                }
                
                childTable.addRow(rowData);
                
                if (config.onInstanceAdded) {
                    config.onInstanceAdded();
                }
            }
        }
    });
    
    box.add(addInstanceToggle, 'left');
    
    const dialog = $$(TopBottomStatic, {
        topHeight: 40,
        top: box,
        bottom: listView
    });
    
    return dialog;
}

export default createListDialog;