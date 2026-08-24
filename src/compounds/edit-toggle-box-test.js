import { DomRegistry as DOM } from '../dom-registry.js';
import SimpleView from '../dom-comps/simple-view.js';
import TopBottomStatic from '../dom-comps/top-bottom-static.js';
import EditToggle from '../dom-comps/edit-toggle.js';
import EditToggleBox from '../dom-comps/edit-toggle-box.js';

const $$ = DOM.create;

function ABC() {
    const resultView = $$(SimpleView, { title: 'Result: none' });
    
    const box = $$(EditToggleBox);
    
    const toggle1 = $$(EditToggle, {
        idleLabel: '+ Column',
        editChildren: [
            { type: 'input', name: 'name', placeholder: 'column name' },
            { type: 'button', label: 'Ok', action: 'ok' },
            { type: 'button', label: 'Cancel', action: 'cancel' }
        ],
        onfinish: (confirmed, values) => {
            if (confirmed) {
                resultView.setTitle(`Added column: ${values.name}`);
            } else {
                resultView.setTitle('Cancelled');
            }
        }
    });
    
    const toggle2 = $$(EditToggle, {
        idleLabel: '+ Row',
        editChildren: [
            { type: 'button', label: 'Ok', action: 'ok' },
            { type: 'button', label: 'Cancel', action: 'cancel' }
        ],
        onfinish: (confirmed) => {
            if (confirmed) {
                resultView.setTitle('Added row');
            } else {
                resultView.setTitle('Cancelled');
            }
        }
    });
    
    const toggle3 = $$(EditToggle, {
        idleLabel: '+ Table',
        editChildren: [
            { type: 'input', name: 'name', placeholder: 'table name' },
            { type: 'button', label: 'Ok', action: 'ok' },
            { type: 'button', label: 'Cancel', action: 'cancel' }
        ],
        onfinish: (confirmed, values) => {
            if (confirmed) {
                resultView.setTitle(`Added table: ${values.name}`);
            } else {
                resultView.setTitle('Cancelled');
            }
        }
    });
    
    box
        .add(toggle1)
        .add(toggle2)
        .add(toggle3);
    
    const test = $$(TopBottomStatic, {
        topHeight: 40,
        top: box,
        bottom: resultView
    });
    
    return test;
}


export default ABC;