import { DomRegistry as DOM } from '../dom-registry.js';
import SimpleView from '../dom-comps/simple-view.js';
import TopBottomStatic from '../dom-comps/top-bottom-static.js';
import TextInput from '../dom-comps/text-input.js';
import SelectBox from '../dom-comps/select-box.js';
import Button from '../dom-comps/button.js';
import Toolbar from '../dom-comps/toolbar.js';
import EditToggle from '../dom-comps/edit-toggle.js';
import EditToggleBox from '../dom-comps/edit-toggle-box.js';
import TestLayout from '../compounds/layout-test.js';

const TBS = (options) => DOM.create(TopBottomStatic, { topHeight: 40, ...options});

/**
 * @param {Object} args
 * @param {Array<{value: string, data: string}>} args.typeOptions
 */
function createAddPropertyDialog(args) {
    const toolbar = DOM.create(Toolbar, {});
    const out = { name: '', type: '', target_uuid: '' };
    let typeSelect = null;
    
    const input = DOM.create(TextInput, { value: '', placeholder: 'property name' });
    const inputOff = input.on('change', (msg) => { out.name = msg.value });

    const select = DOM.create(SelectBox, {
        options: [
            { value: '1', label: 'String' },
            { value: '2', label: 'Number' },
            { value: '3', label: 'Boolean' },
            { value: '42', label: 'Link' }
        ]
    });
    out.type = select.getValue();
    select.on('change', (msg) => {
        out.type = msg.value;
        if (msg.value === '42') {
            typeSelect = DOM.create(SelectBox, { options: args.typeOptions });
            toolbar.add(typeSelect, { after: select });
            out.uuid = typeSelect.getValue();
            typeSelect.on('change', (msg) => { out.uuid = msg.value });
        }
        else {
            if (typeSelect) {
                toolbar.remove(typeSelect);
                typeSelect = null;
                out.type = select.getType();
            }
        }
    });

    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('click', () => toolbar.emit('add-prop-ok', out));

    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('click', () => toolbar.emit('add-prop-cancel', {}));
    
    toolbar.add(input);
    toolbar.add(select);
    toolbar.add(confirm);
    toolbar.add(cancel);
    
    return toolbar;
}

function createOkButton(args) {
    return DOM.create(Button, {label: 'Ok' });
}

function _Test() {
    const editToggleBox = DOM.create(EditToggleBox);
    const log = DOM.create(SimpleView);

    const editAddPropertyDialog = createAddPropertyDialog({
        typeOptions: [
            { value: '11111111-1111-1111-1111-111111111111', label: 'City' },
            { value: '22222222-2222-2222-2222-222222222222', label: 'Building' },
            { value: '33333333-3333-3333-3333-333333333333', label: 'Country' }
        ]    
    });
    editAddPropertyDialog.on('add-prop-ok', (msg) => {
        log.setTitle(`
            name: ${msg.name},
            type: ${msg.type},
            uuid: ${msg.uuid}
        `);
        editAddPropertyDialog.emit('close'); // EditToggle doesn't need more info
    });
    editAddPropertyDialog.on('add-prop-cancel', (msg) => {
        log.setTitle('Cancelled.');
        editAddPropertyDialog.emit('close');
    });

    const addPropertyToggle = DOM.create(EditToggle, {
        idleLabel: '+ Property',
        editCompound: editAddPropertyDialog
    });
    editToggleBox.add(addPropertyToggle);

    const tbs = TBS({ top: editToggleBox, bottom: log })
    
    return TestLayout(tbs);
}

function Test() {
    const editToggleBox = DOM.create(EditToggleBox);
    const log = DOM.create(SimpleView);

    // Toggle 1: Add Property
    const editAddPropertyDialog = createAddPropertyDialog({
        typeOptions: [
            { value: '11111111-1111-1111-1111-111111111111', label: 'City' },
            { value: '22222222-2222-2222-2222-222222222222', label: 'Building' },
            { value: '33333333-3333-3333-3333-333333333333', label: 'Country' }
        ]    
    });
    editAddPropertyDialog.on('add-prop-ok', (msg) => {
        log.setTitle(`name: ${msg.name}, type: ${msg.type}, uuid: ${msg.uuid}`);
        editAddPropertyDialog.emit('close');
    });
    editAddPropertyDialog.on('add-prop-cancel', (msg) => {
        log.setTitle('Cancelled.');
        editAddPropertyDialog.emit('close');
    });

    const addPropertyToggle = DOM.create(EditToggle, {
        idleLabel: '+ Property',
        editCompound: editAddPropertyDialog
    });
    editToggleBox.add(addPropertyToggle);

    // Toggle 2: Add Type (simple button as placeholder)
    const okButton = DOM.create(Button, { label: 'Ok' });
    okButton.on('click', () => {
        log.setTitle('Type added.');
        okButton.emit('close');
    });
    
    const addTypeToggle = DOM.create(EditToggle, {
        idleLabel: '+ Type',
        editCompound: okButton
    });
    editToggleBox.add(addTypeToggle);

    const tbs = TBS({ top: editToggleBox, bottom: log })
    
    return TestLayout(tbs);
}

export default Test;