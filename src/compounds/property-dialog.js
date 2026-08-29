import { DomRegistry as DOM } from '../dom-registry.js';
import PropertyView from '../dom-comps/property-view.js';
import EditToggle from '../dom-comps/edit-toggle.js';
import EditToggleBox from '../dom-comps/edit-toggle-box.js';
import TopBottomStatic from '../dom-comps/top-bottom-static.js';

const $$ = DOM.create;
const Props = (iPropertyData) => $$(PropertyView, iPropertyData);

function createPropertyDialog(model, rowData, config = {}) {
    const propertyView = Props(rowData);
    
    const box = $$(EditToggleBox);
    
    if (rowData && config.tableUuid) {
        const table = model.getTable(config.tableUuid);
        
        const tableEntries = Array.from(model.tables.values());
        
        const addPropertyToggle = $$(EditToggle, {
            idleLabel: '+ Property',
            editLabel: 'Add Property',
            editChildren: [
                { type: 'input', name: 'name', placeholder: 'property name' },
                { 
                    type: 'select',
                    name: 'datatype',
                    options: [
                        { value: '1', label: 'string' },
                        { value: '2', label: 'number' },
                        { value: '3', label: 'boolean' },
                        { value: '42', label: 'link' }
                    ]
                },
                { 
                    type: 'select',
                    name: 'targetType',
                    options: tableEntries.map(t => ({ value: t.uuid, label: t.name })),
                    visibleWhen: { field: 'datatype', value: '42' }
                },
                { type: 'button', label: 'Ok', action: 'ok' },
                { type: 'button', label: 'Cancel', action: 'cancel' }
            ],
            onfinish: (confirmed, values) => {
                if (confirmed && values.name) {
                    const spec = {
                        name: values.name,
                        type: Number(values.datatype)
                    };
                    
                    if (values.datatype === '42') {
                        spec.targetTableUuid = values.targetType;
                    }
                    
                    table.addColumn(spec);
                    
                    if (config.onPropertyAdded) {
                        config.onPropertyAdded();
                    }
                }
            }
        });
        
        box.add(addPropertyToggle, 'left');
    }
    
    const dialog = $$(TopBottomStatic, {
        topHeight: 40,
        top: box,
        bottom: propertyView
    });
    
    return dialog;
}

export default createPropertyDialog;