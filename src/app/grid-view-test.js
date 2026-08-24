import { DomRegistry as DOM } from '../dom-registry.js';
import GridView from '../dom-comps-old/grid-view.js';
import Toolbar from '../dom-comps-old/toolbar.js';
import EditToggle from '../dom-comps-old/edit-toggle.js';
import Button from '../dom-comps-old/button.js';
import TopBottomStatic from '../dom-comps-old/top-bottom-static.js';
import { createGridInterface } from '../shared/model2grid.js';

const $$ = DOM.create;

function createGridViewTest(model) {
    const cityTable = Array.from(model.tables.values()).find(t => t.name === 'City');
    
    const gridIface = createGridInterface(model, cityTable.uuid);
    gridIface.getCellHeight = () => 28;
    const gridView = $$(GridView, gridIface);
    
    // Initial setup
    gridView
        .addDeleteColumn()
        .addIndexColumn();
    
    const columns = gridIface.getColumns();
    for (const column of columns) {
        gridView.addColumn(column);
    }
    
    const tableNames = Array.from(model.tables.values()).map(table => ({
        value: table.uuid,
        label: table.name
    }));
    
    const toolbar = $$(Toolbar)
        .add({
            clsid: Button,
            name: 'add-row',
            label: '+ Row',
            onClick: () => gridIface.addRow()
        })
        .add({
            clsid: EditToggle,
            name: 'add-column',
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
                    options: tableNames,
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
    
    const test = $$(TopBottomStatic, { ratio: 0.1 })
        .setTop(toolbar)
        .setBottom(gridView);
    
    return test;
}

export { createGridViewTest };