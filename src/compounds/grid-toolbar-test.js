import { DomRegistry as DOM } from '../dom-registry.js';
import SimpleView from '../dom-comps/simple-view.js';
import TopBottomStatic from '../dom-comps/top-bottom-static.js';
import Button from '../dom-comps/button.js';
import EditToggle from '../dom-comps/edit-toggle.js';
import EditToggleBox from '../dom-comps/edit-toggle-box.js';

const $$ = DOM.create;

function Test() {
    const resultView = $$(SimpleView, { title: 'No action' });
    
    const box = $$(EditToggleBox);
    
    // Add row button
    const addRowBtn = $$(Button, {
        label: '+ Row',
        onClick: () => {
            resultView.setTitle('Action: add row');
        }
    });
    
    // Add column edit toggle
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
                options: [
                    { value: 'building', label: 'Building' },
                    { value: 'person', label: 'Person' },
                    { value: 'country', label: 'Country' }
                ],
                visibleWhen: { field: 'type', value: '42' }
            },
            { type: 'button', label: 'Ok', action: 'ok' },
            { type: 'button', label: 'Cancel', action: 'cancel' }
        ],
        onfinish: (confirmed, values) => {
            if (confirmed) {
                const msg = values.type === '42'
                    ? `Add link column '${values.name}' → ${values.targetTable}`
                    : `Add column '${values.name}' (type ${values.type})`;
                resultView.setTitle(msg);
            } else {
                resultView.setTitle('Action: cancelled');
            }
        }
    });
    
    // Remove column edit toggle
    const removeColToggle = $$(EditToggle, {
        idleLabel: '🗑',
        idleClass: 'danger',
        editLabel: 'Remove Column',
        editChildren: [
            { 
                type: 'select', 
                name: 'column',
                options: [
                    { value: 'name', label: 'name' },
                    { value: 'population', label: 'population' },
                    { value: 'isCapital', label: 'isCapital' }
                ]
            },
            { type: 'button', label: 'Ok', action: 'ok' },
            { type: 'button', label: 'Cancel', action: 'cancel' }
        ],
        onfinish: (confirmed, values) => {
            if (confirmed) {
                resultView.setTitle(`Action: remove column '${values.column}'`);
            } else {
                resultView.setTitle('Action: cancelled');
            }
        }
    });
    
    box
        .add(addRowBtn, 'left')
        .add(addColToggle, 'center')
        .add(removeColToggle, 'right');

    const test = $$(TopBottomStatic, {
        topHeight: 32,
        top: box,
        bottom: resultView
    });
    
    return test;
}

export default Test;