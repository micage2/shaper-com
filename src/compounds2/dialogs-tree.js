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
    const button = DOM.create(Button, { label, size: 14 });
    button.on('clicked', function() {
        button.emit('close');
    });
    return button;
}

function CreateType(iModel) {
    const toolbar = DOM.create(Toolbar, {});
    const label = DOM.create(Label, { text: 'Create Type:' });
    const input = DOM.create(TextInput, { value: '', placeholder: 'Type name' });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', () => {
        const name = input.getValue().trim();
        if (name) {
            iModel.createTable(name);
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

function RenameType(iModel) {
    const toolbar = DOM.create(Toolbar, {});
    const label = DOM.create(Label, { text: 'Rename Type:' });
    const input = DOM.create(TextInput, { value: '', placeholder: 'New name' });

    let currentTableUuid;
    iModel.on('table-selected', (table) => {
        currentTableUuid = table.uuid;
    });

    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', () => {
        const value = input.getValue().trim();
        iModel.renameTable(currentTableUuid, value);
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

function DeleteType(iModel) {
    const toolbar = DOM.create(Toolbar, {});
    const label = DOM.create(Label, { text: 'Delete Type?' });

    let currentTableUuid;
    iModel.on('table-selected', (table) => {
        currentTableUuid = table.uuid;
        label.setText(`Delete "${table.name}" Table?`);
    });

    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', () => {
        toolbar.emit('close');
        iModel.deleteTable(currentTableUuid);
    });
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('clicked', () => toolbar.emit('close'));
    
    toolbar.add(label);
    toolbar.add(confirm);
    toolbar.add(cancel);
    return toolbar;
}

function CreateProperty(iface) {
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

    let currentTableUuid = null;
    iface.on('node-selected', node => {
        currentTableUuid = node.tableUuid;
    });
    
    // add selector for links
    let targetSelect = null;
    typeSelect.on('changed', function(msg) {
        const type = Number(msg.value);
        if (type === 42 && !targetSelect) {
            const linkTargets = iface.getLinkOptions();
            targetSelect = Selector({ options: linkTargets });
            toolbar.add(targetSelect, { after: typeSelect });
        }
        else if (type !== 42 && targetSelect) {
            toolbar.remove(targetSelect);
            targetSelect = null;
        }
    });

    function reset() {
        if (targetSelect) {
            toolbar.remove(targetSelect);
            targetSelect = null;
        }
        typeSelect.setValue('1');
        input.setValue('');
    }    
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', () => {
        const name = input.getValue();
        const type = +typeSelect.getValue();
        const targetTableUuid = targetSelect?.getValue();

        iface.createColumn(currentTableUuid, { name, type, targetTableUuid});

        toolbar.emit('close');
        reset();
    });
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('clicked', () => {
        toolbar.emit('close');
        reset();
    });
    
    toolbar.add(input);
    toolbar.add(typeSelect);
    toolbar.add(confirm);
    toolbar.add(cancel);
    toolbar.on('mounted', () => input.focus());
    return toolbar;
}

function RenameProperty(db) {
    let select = Selector();
    let input = null;

    let currentTypeUuid = null;
    db.on('type-selected', (type) => {
        currentTypeUuid = type.uuid;
        toolbar.remove(input);
        toolbar.remove(select);

        const options = db.getColumns(currentTypeUuid).map(col => ({
            label: col.name, value: col.id
        }));
        options.shift(); // remove 'name' prop
        select = Selector({ options });
        select.on('changed', (msg) => {
            input.setValue(msg.label);
        });

        input = DOM.create(TextInput, {
            value: select.getSelected().label, placeholder: 'New name'
        });

        toolbar.add(input, { after: label });
        toolbar.add(select, { after: label });
    });

    const toolbar = DOM.create(Toolbar, {});
    const label = DOM.create(Label, { text: 'Rename Property:' });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', () => {
        const colId = select.getValue();
        const value = input.getValue().trim();

        db.renameColumn(currentTypeUuid, colId, value);
        
        toolbar.emit('close');
    });
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('clicked', () => toolbar.emit('close'));
    
    toolbar.add(label);
    toolbar.add(select);
    toolbar.add(confirm);
    toolbar.add(cancel);
    toolbar.on('mounted', () => {
        input.focus();
    });
    return toolbar;
}

function DeleteProperty(db) {
    let select = Selector();

    let currentTableUuid = null;
    db.on('type-selected', (table) => {
        currentTableUuid = table.uuid;
        toolbar.remove(select);

        const options = db.getColumns(currentTableUuid).map(col => ({
            label: col.name, value: col.id
        }));

        select = Selector({ options });
        toolbar.add(select, { after: label });
    });

    // iTable.on('db-column-created', col => {
    //     // console.log('[DeleteProperty] column-created', col);
    //     if (currentTableUuid === col.tableUuid)
    //         select.addOption(col.name, col.id);     
    // });

    // iTable.on('db-column-deleted', col => {
    //     // console.log('[DeleteProperty] column-deleted', col);
    //     if (currentTableUuid === col.tableUuid)
    //         select.removeOption(col.id);     
    // });

    const toolbar = DOM.create(Toolbar, {});
    const label = DOM.create(Label, { text: 'Delete Property:' });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', () => {
        const colId = select.getValue();
        db.deleteColumn(currentTableUuid, colId);
        toolbar.emit('close');
    });
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('clicked', () => toolbar.emit('close'));
    
    toolbar.add(label);
    toolbar.add(select);
    toolbar.add(confirm);
    toolbar.add(cancel);
    return toolbar;
}

function CreateInstance(iface) {
    const toolbar = DOM.create(Toolbar, {});
    const label = DOM.create(Label, { text: 'New Instance' });
    const input = DOM.create(TextInput, { value: '', placeholder: 'Name' });

    const text = `Use current type selection`;
    // All types are possible.
    // All newly created instances are root level unless their type
    // has a link column pointing to the selected node's type.
    // console.log('⚙️', '[Dialog.CreateInstance]', text);

    let currentTableUuid = null;
    iface.on('type-selected', (type) => {
        currentTableUuid = type.uuid;
    });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', () => {
        const name = input.getValue().trim();
        if (name && currentTableUuid) {
            iface.createRow(currentTableUuid, { name });
        }
        toolbar.emit('close');
    });
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('clicked', () => toolbar.emit('close'));
    
    toolbar.add(label);
    toolbar.add(input);
    toolbar.add(confirm);
    toolbar.add(cancel);
    toolbar.on('mounted', () => {
        input.setValue('');
        input.focus();
    });
    return toolbar;
}

function DeleteInstance(iRow) {
    let currentTableUuid;
    let currentRowId = null;
    iRow.on('table-selected', (table) => {
        currentTableUuid = table.uuid;
    });
    iRow.on('row-selected', (row) => {
        currentRowId = row.id;
        label.setText(`Delete row ${row.name}?`);
    });

    const toolbar = DOM.create(Toolbar, {});
    const label = DOM.create(Label, { text: 'Delete Instance?' });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', () => {
        iRow.deleteRow(currentRowId);
        toolbar.emit('close');
    });
    
    const cancel = DOM.create(Button, { label: '✗' });
    cancel.on('clicked', () => toolbar.emit('close'));
    
    toolbar.add(label);
    toolbar.add(confirm);
    toolbar.add(cancel);
    return toolbar;
}

export default {
    IdleButton,

    CreateType,
    RenameType,
    DeleteType,

    CreateProperty,
    RenameProperty,
    DeleteProperty,
    
    CreateInstance,
    DeleteInstance,
}

