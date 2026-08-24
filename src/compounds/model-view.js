import { DomRegistry as DOM } from '../dom-registry.js';
import GridView from '../dom-comps/grid-view.js';
import EditToggle from '../dom-comps/edit-toggle.js';
import EditToggleBox from '../dom-comps/edit-toggle-box.js';
import Button from '../dom-comps/button.js';
import SelectBox from '../dom-comps/select-box.js';
import SimpleView from '../dom-comps/simple-view.js';
import TopBottomStatic from '../dom-comps/top-bottom-static.js';
import { createGridInterface } from '../shared/model2grid.js';

const $$ = DOM.create;

function createModelView(model) {
    const tableEntries = Array.from(model.tables.values());
    let currentTableUuid = tableEntries[0].uuid;
    
    let tbs = null;
    let gridDialog = null;
    
    function buildGridDialog(tableUuid) {
        const gridIface = createGridInterface(model, tableUuid);
        gridIface.getCellHeight = () => 28;
        
        const gridView = $$(GridView, gridIface);
        
        gridView
            .addDeleteColumn()
            .addIndexColumn();
        
        for (const column of gridIface.getColumns()) {
            gridView.addColumn(column);
        }
        
        const box = $$(EditToggleBox);
        
        const tableSelect = $$(SelectBox, {
            options: tableEntries.map(t => ({ value: t.uuid, label: t.name })),
            value: tableUuid,
            onChange: (uuid) => {
                switchTable(uuid);
            }
        });
        
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
                    options: () => gridIface.getColumns().map(col => ({
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
        
        box
            .add(tableSelect, 'left')
            .add(addRowBtn, 'left')
            .add(addColToggle, 'right')
            .add(removeColToggle, 'right');
        
        const dialog = $$(TopBottomStatic, {
            topHeight: 40,
            top: box,
            bottom: gridView
        });
        
        return dialog;
    }
    
    function switchTable(uuid) {
        if (uuid === currentTableUuid) return;
        
        currentTableUuid = uuid;
        
        const newGridDialog = buildGridDialog(uuid);
        
        if (gridDialog) {
            DOM.detach(gridDialog);
        }
        
        gridDialog = newGridDialog;
        
        DOM.attach(gridDialog, tbs, { slot: 'bottom' });
    }
    
    gridDialog = buildGridDialog(currentTableUuid);
    
    tbs = $$(TopBottomStatic, {
        topHeight: 0,
        top: $$(SimpleView, { title: '' }),
        bottom: gridDialog
    });
    
    return tbs;
}

export default createModelView;