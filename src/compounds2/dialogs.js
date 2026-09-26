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
        button.emit('close');
    });
    return button;
}

// deprecated
function TableSelector(iModel) {
    const select = Selector();
    const shell = Shell(select);

    select.on('changed', (data) => {
        console.log('[TypeSelect] -> changed', data);
        shell.emit('table-selected', { uuid: data.value });
        iModel.showTableView(data.value, iModel.getLinks());
    });
    
    iModel.on('table-created', (data) => {
        const hadSelection = !!select.getValue();
        select.addOption(data.name, data.uuid);
        if (!hadSelection) {
            shell.emit('table-selected', { uuid: data.uuid });
            iModel.showTableView(data.uuid, iModel.getLinks());
        }
    });
    
    iModel.on('table-renamed', (data) => {
        select.setLabel(data.tableUuid, data.name);
    });
    
    iModel.on('table-deleted', (table) => {
        const oldTableUuid = select.getValue();
        select.removeOption(table.tableUuid);

        if (table.tableUuid === oldTableUuid) {
            const options = iModel.getLinks();
            if (options.length > 0) {
                iModel.showTableView(options[0].value, options);
            } else {
                iModel.showEmptyView();
            }
        }

        const currentTableUuid = select.getValue();
        shell.emit('table-selected', { uuid: currentTableUuid });
    });
    
    return shell;
}

function AddTable(iModel) {
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

function RenameTable(iModel) {
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

function DeleteTable(iModel) {
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

function AddRow(iface) {
    const toolbar = DOM.create(Toolbar, {});
    const label = DOM.create(Label, { text: 'New Instance' });
    const input = DOM.create(TextInput, { value: '', placeholder: 'Name' });
    
    let currentTableUuid = null;
    iface.on('table-selected', (data) => {
        currentTableUuid = data.uuid;
    });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', () => {
        const name = input.getValue().trim();
        if (name && currentTableUuid) {
            iface.createRow({ name });
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

function DeleteRow(iRow) {
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

function AddColumn(iface) {
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
    iface.on('table-selected', (table) => {
        currentTableUuid = table.uuid;
    });
    
    // add selector for links
    let targetSelect = null;
    typeSelect.on('changed', function(msg) {
        const type = Number(msg.value);
        if (type === 42 && !targetSelect) {
            const linkTargets = iface.getLinks();
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

function DeleteColumn(iTable) {
    let select = Selector();

    let currentTableUuid = null;
    iTable.on('table-selected', (table) => {
        currentTableUuid = table.uuid;
        toolbar.remove(select);
        select = Selector();
        toolbar.add(select, { after: label });
    });

    iTable.on('column-created', col => {
        // console.log('[DeleteProperty] column-created', col);
        select.addOption(col.name, col.id);     
    });

    iTable.on('column-deleted', col => {
        // console.log('[DeleteProperty] column-deleted', col);
        select.removeOption(col.id);     
    });

    const toolbar = DOM.create(Toolbar, {});
    const label = DOM.create(Label, { text: 'Delete Property:' });
    
    const confirm = DOM.create(Button, { label: '✓' });
    confirm.on('clicked', () => {
        const colId = select.getValue();
        iTable.deleteColumn(currentTableUuid, colId);
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

export default {
    IdleButton,
    TableSelector,

    AddTable,
    RenameTable,
    DeleteTable,
    
    AddRow,
    DeleteRow,

    AddColumn,
    DeleteColumn
}

