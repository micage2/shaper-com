import { DomRegistry as DOM } from '../dom-registry.js';
import SimpleView from '../dom-comps-old/simple-view.js';
import TopBottomStatic from '../dom-comps-old/top-bottom-static.js';
import EditToggle from '../dom-comps-old/edit-toggle.js';

const $$ = DOM.create;

function createEditToggleTest() {
    const resultView = $$(SimpleView, { title: 'Result: none' });
    
    const editToggle = $$(EditToggle, {
        idleLabel: '+ Column',
        editLabel: "Add Column",
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
            { type: 'button', label: 'Ok', action: 'ok' },
            { type: 'button', label: 'Cancel', action: 'cancel' }
        ],
        onfinish: (confirmed, values) => {
            if (confirmed) {
                resultView.setTitle(`Added column: ${values.name} (type ${values.type})`);
            } else {
                resultView.setTitle('Cancelled');
            }
        }
    });
    
    const test = $$(TopBottomStatic, { ratio: 0.1 })
        .setTop(editToggle)
        .setBottom(resultView);
    
    return test;
}

export { createEditToggleTest };