import { DomRegistry as DOM } from '../dom-registry.js';
import GridView from '../dom-comps/grid-view.js';
import EditToggle from '../dom-comps/edit-toggle.js';
import EditToggleBox from '../dom-comps/edit-toggle-box.js';
import Button from '../dom-comps/button.js';
import SelectBox from '../dom-comps/select-box.js';
import TopBottomStatic from '../dom-comps/top-bottom-static.js';
import { createGridInterface } from '../shared/model2grid.js';

const $$ = DOM.create;

function createGridViewTest(model) {
    const tableEntries = Array.from(model.tables.values());
    let currentTable = tableEntries.find(t => t.name === 'City');
    
    let gridIface = createGridInterface(model, currentTable.uuid);
    gridIface.getCellHeight = () => 28;
    
    let gridView = $$(GridView, gridIface);
    
    gridView
        .addDeleteColumn()
        .addIndexColumn();
    
    for (const column of gridIface.getColumns()) {
        gridView.addColumn(column);
    }
    
    const box = $$(EditToggleBox);
    
    const addRowBtn = $$(Button, {
        label: '+ Row',
        onClick: () => {
            gridIface.addRow();
        }
    });
    
    const addColToggle = $$(EditToggle, {
        idleLabel: '+ Column',
        editLabel: 'Add Column',
        editChildren: [
            { type: 'input', name: 'name', placeholder: 'column name' },
            { 
                type: 'select', 
                name: 'type',
                options: [
                    { value: '1', label: 'string' },
                    { value: '2', label: 'number' },
                    { value: '3', label: 'boolean' },
                    { value: '42', label: 'link' }
                ]
            },
            { 
                type: 'select',
                name: 'targetTable',
                options: tableEntries.map(t => ({
                    value: t.uuid,
                    label: t.name
                })),
                visibleWhen: { field: 'type', value: '42' }
            },
            { type: 'button', label: 'Ok', action: 'ok' },
            { type: 'button', label: 'Cancel', action: 'cancel' }
        ],
        onfinish: (confirmed, values) => {
            if (confirmed) {
                const spec = {
                    name: values.name,
                    type: Number(values.type)
                };
                
                if (values.type === '42') {
                    spec.targetTableUuid = values.targetTable;
                }
                
                gridIface.addColumn(spec);
            }
        }
    });
    
    const removeColToggle = $$(EditToggle, {
        idleLabel: '🗑',
        idleClass: 'danger',
        editLabel: 'Remove Column',
        editChildren: [
            { 
                type: 'select',
                name: 'column',
                options: gridIface.getColumns().map(col => ({
                    value: col.colId,
                    label: col.name
                }))
            },
            { type: 'button', label: 'Ok', action: 'ok' },
            { type: 'button', label: 'Cancel', action: 'cancel' }
        ],
        onfinish: (confirmed, values) => {
            if (confirmed) {
                gridIface.removeColumn(values.column);
            }
        }
    });
    
    let testComponent = null;
    
    const tableSelect = $$(SelectBox, {
        options: tableEntries.map(t => ({ value: t.uuid, label: t.name })),
        value: currentTable.uuid,
        onChange: (uuid) => {
            const table = tableEntries.find(t => t.uuid === uuid);
            if (table && table.uuid !== currentTable.uuid) {
                currentTable = table;
                
                DOM.detach(gridView);
                
                gridIface = createGridInterface(model, table.uuid);
                gridIface.getCellHeight = () => 28;
                
                gridView = $$(GridView, gridIface);
                
                gridView
                    .addDeleteColumn()
                    .addIndexColumn();
                
                for (const column of gridIface.getColumns()) {
                    gridView.addColumn(column);
                }
                
                DOM.attach(gridView, testComponent, { slot: 'bottom' });
            }
        }
    });
    
    box
        .add(tableSelect, 'left')
        .add(addRowBtn, 'center')
        .add(addColToggle, 'right')
        .add(removeColToggle, 'right');
    
    testComponent = $$(TopBottomStatic, {
        topHeight: 40,
        top: box,
        bottom: gridView
    });
    
    return testComponent;
}

export default createGridViewTest;