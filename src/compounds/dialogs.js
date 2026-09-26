import { DomRegistry as DOM } from '../dom-registry.js';

import Shelly from '../dom-comps/shell.js';
import Toolbar from '../dom-comps/toolbar.js';
import SelectBox from '../dom-comps/select-box.js';
import Button from '../dom-comps/button.js';
import TextInput from '../dom-comps/text-input.js';
import Label from '../dom-comps/label.js';

// shortcut
const Selector = (options) => DOM.create(SelectBox, options);
const Shell = (child) => DOM.create(Shelly, { child });

// idle state compound, will be replaced by edit compound when closed (by button click)
function IdleButton(label) {
    const button = DOM.create(Button, { label });
    button.on('clicked', function() {
        this.emit('close');
    });
    return button;
}

// TypeSelect - subscribes to parent events, emits 'changed' on its own root
function TypeSelect(iface) {
    const select = Selector({ options: [] });
    const shell = Shell(select);

    select.on('changed', (data) => {
        console.log('[TypeSelect] -> changed', data);
        shell.emit('table-selected', { tableUuid: data.value });
    });
    
    iface.on('table-created', (data) => {
        const hadSelection = !!select.getValue();
        select.addOption(data.name, data.tableUuid);
        if (!hadSelection) {
            shell.emit('table-selected', { tableUuid: data.tableUuid });
        }
    });
    
    iface.on('table-renamed', (data) => {
        select.setLabel(data.tableUuid, data.name);
    });
    
    iface.on('table-deleted', (data) => {
        select.removeOption(data.tableUuid);
        shell.emit('table-selected', { tableUuid: select.getValue() });
    });
    
    return shell;
}

// AddType
function AddType(iface) {
    const toolbar = DOM.create(Toolbar, {});
    const label = DOM.create(Label, { text: 'Create Type:' });
    const input = DOM.create(TextInput, { value: '', placeholder: 'Type name' });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', () => {
        const name = input.getValue().trim();
        if (name) {
            iface.create(name);
        }
        toolbar.emit('close');
    });
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('clicked', () => toolbar.emit('close'));
    
    toolbar.add(label);
    toolbar.add(input);
    toolbar.add(confirm);
    toolbar.add(cancel);
    toolbar.on('mounted', () => input.focus());
    return toolbar;
}

// RenameType
function RenameType(iface) {
    const toolbar = DOM.create(Toolbar, {});
    const label = DOM.create(Label, { text: 'Rename Type:' });
    const input = DOM.create(TextInput, { value: '', placeholder: 'New name' });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', () => toolbar.emit('close'));
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('clicked', () => toolbar.emit('close'));
    
    toolbar.add(label);
    toolbar.add(input);
    toolbar.add(confirm);
    toolbar.add(cancel);
    toolbar.on('mounted', () => input.focus());
    return toolbar;
}

// DeleteType
function DeleteType(iTable) {
    const toolbar = DOM.create(Toolbar, {});
    const label = DOM.create(Label, { text: 'Delete Type?' });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', () => {
        toolbar.emit('close');
        iTable.remove();
    });
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('clicked', () => toolbar.emit('close'));
    
    toolbar.add(label);
    toolbar.add(confirm);
    toolbar.add(cancel);
    return toolbar;
}

// AddInstance
export function AddInstance(iface) {
    const toolbar = DOM.create(Toolbar, {});
    const label = DOM.create(Label, { text: 'New Instance' });
    const input = DOM.create(TextInput, { value: '', placeholder: 'Name' });
    
    let currentTableUuid = null;
    
    iface.on('table-selected', (data) => {
        currentTableUuid = data.tableUuid;
    });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', () => {
        const name = input.getValue().trim();
        if (name && currentTableUuid) {
            iface.create(currentTableUuid, { name });
        }
        toolbar.emit('close');
    });
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('clicked', () => toolbar.emit('close'));
    
    toolbar.add(label);
    toolbar.add(input);
    toolbar.add(confirm);
    toolbar.add(cancel);
    toolbar.on('mounted', () => input.focus());
    return toolbar;
}

// DeleteInstance
function DeleteInstance(iface) {
    const toolbar = DOM.create(Toolbar, {});
    const label = DOM.create(Label, { text: 'Delete Instance?' });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', () => toolbar.emit('close'));
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('clicked', () => toolbar.emit('close'));
    
    toolbar.add(label);
    toolbar.add(confirm);
    toolbar.add(cancel);
    return toolbar;
}

// AddProperty
function AddProperty(iface) {
    const toolbar = DOM.create(Toolbar, {});
    const input = DOM.create(TextInput, { value: '', placeholder: 'Property name' });
    const typeSelect = Selector({
        options: [
            { value: '1', label: 'String' },
            { value: '2', label: 'Number' },
            { value: '3', label: 'Boolean' },
            { value: '42', label: 'Link' }
        ]
    });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', () => toolbar.emit('close'));
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('clicked', () => toolbar.emit('close'));
    
    toolbar.add(input);
    toolbar.add(typeSelect);
    toolbar.add(confirm);
    toolbar.add(cancel);
    toolbar.on('mounted', () => input.focus());
    return toolbar;
}

// DeleteProperty
function DeleteProperty(iface) {
    const toolbar = DOM.create(Toolbar, {});
    const label = DOM.create(Label, { text: 'Delete Property:' });
    const select = Selector({ options: [] });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', () => toolbar.emit('close'));
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('clicked', () => toolbar.emit('close'));
    
    toolbar.add(label);
    toolbar.add(select);
    toolbar.add(confirm);
    toolbar.add(cancel);
    return toolbar;
}

export default {
    IdleButton,
    TypeSelect,

    AddType,
    RenameType,
    DeleteType,
    
    AddInstance,
    DeleteInstance,

    AddProperty,
    DeleteProperty
}

