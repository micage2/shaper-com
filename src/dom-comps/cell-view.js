import { DomRegistry as DOM } from '../dom-registry.js';
import { getRowLabel } from '../shared/tree-utils.js';

function ctor(args = {}) {
    const self = this;
    
    const type = args.type;
    const table = args.table;
    const model = args.model;
    const rowId = args.rowId;
    const colId = args.colId;
    const targetTableUuid = args.targetTableUuid || null;
    const validator = args.validator || null;
    
    const host = document.createElement('div');
    host.className = 'cell-view';

    host.style.cssText = `
        height: var(--cell-height, 28px);
        display: flex;
        align-items: center;
        position: relative;
        overflow: hidden;
        border-bottom: var(--cell-border, 1px solid #eee);
        border-right: var(--cell-border-right, 1px solid #ddd);
        box-sizing: border-box;
        user-select: none;
    `;

    const idleContainer = document.createElement('div');
    idleContainer.style.cssText = 'width:100%; height:100%; display:flex; align-items:center;';
    
    if (type === 2) {
        idleContainer.style.justifyContent = 'flex-end';
    } else if (type === 3) {
        idleContainer.style.justifyContent = 'center';
    } else {
        idleContainer.style.justifyContent = 'flex-start';
    }
    
    host.appendChild(idleContainer);
    
    const editContainer = document.createElement('div');
    editContainer.style.cssText = 'display:none; width:100%; height:100%;';
    host.appendChild(editContainer);
    
    function getValue() {
        return table.getCell(rowId, colId);
    }
    
    function setValue(value) {
        if (validator && !validator(value)) {
            return false;
        }
        table.setCell(rowId, colId, value);
        return true;
    }
    
    function showIdle() {
        idleContainer.innerHTML = '';
        editContainer.innerHTML = '';
        editContainer.style.display = 'none';
        idleContainer.style.display = 'flex';
        
        const value = getValue();
        
        if (type === 3) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = value || false;
            checkbox.style.margin = '0 auto';
            checkbox.addEventListener('change', () => {
                setValue(checkbox.checked);
            });
            idleContainer.appendChild(checkbox);
        } else if (type === 42) {
            const span = document.createElement('span');
            span.textContent = getRowLabel(model, targetTableUuid, value);
            span.style.margin = '0 8px';
            idleContainer.appendChild(span);
        } else {
            const span = document.createElement('span');
            span.textContent = value !== null && value !== undefined ? String(value) : '';
            span.style.margin = '0 8px';
            idleContainer.appendChild(span);
        }
    }
    
    function showEdit() {
        editContainer.innerHTML = '';
        editContainer.style.display = 'flex';
        editContainer.style.cssText = 'display:none; position:absolute; left:0; right:0; top:0; height:100%;';        
        const value = getValue();
        
        if (type === 3) {
            return;
        } 
        else if (type === 42) {
            const select = document.createElement('select');
            select.style.cssText = `
                width: 100%;
                min-width: 0;
                height: 100%;
                border: 1px solid #4a90d9;
                padding: 0 8px;
                box-sizing: border-box;
                font: inherit;
            `;
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = '';
            select.appendChild(emptyOption);
            
            const targetTable = model.getTable(targetTableUuid);
            if (targetTable) {
                targetTable.forRows((row) => {
                    const opt = document.createElement('option');
                    opt.value = String(row.id);
                    opt.textContent = getRowLabel(model, targetTableUuid, row.id);
                    select.appendChild(opt);
                });
            }
            
            if (value !== null && value !== undefined) {
                select.value = String(value);
            }
            
            select.addEventListener('change', () => {
                const newValue = select.value === '' ? null : Number(select.value);
                if (setValue(newValue)) {
                    showIdle();
                }
            });
            
            select.addEventListener('blur', () => {
                showIdle();
            });
            
            editContainer.appendChild(select);
        } else {
            const input = document.createElement('input');
            input.type = type === 2 ? 'number' : 'text';
            input.value = value !== null && value !== undefined ? String(value) : '';
            input.style.cssText = `
                flex: 1;
                width: 100%;
                min-width: 0 !important;
                height: 100%;
                border: 1px solid #4a90d9;
                padding: 0 8px;
                box-sizing: border-box;
                font: inherit;
            `;            
            input.setAttribute('size', '1');
            if (type === 2) { input.style.textAlign = 'right'; }

            const commit = () => {
                const newValue = type === 2 ? Number(input.value) : input.value;
                if (setValue(newValue)) {
                    showIdle();
                }
            };
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    commit();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    showIdle();
                }
            });
            
            input.addEventListener('blur', () => {
                if (window.freezeEdit) return;
                commit();
            });

            editContainer.appendChild(input);
        }
        
        idleContainer.style.display = 'none';
        editContainer.style.display = 'block';
        
        const input = editContainer.querySelector('input, select');
        if (input) {
            input.focus();
            // if (input.tagName === 'INPUT') {
            //     input.select();
            // }
        }
    }
    
    if (type !== 3) {
        idleContainer.addEventListener('dblclick', showEdit);
    }
    
    table.on('cell-changed', (data) => {
        if (data.rowId === rowId && data.colId === colId) {
            showIdle();
        }
    });
    
    showIdle();
    
    return {
        getHost() { return host; },
        getInstance() { return {}; }
    };
}

const ICellView = (instance) => ({});

const info = {
    clsid: 'jscom.dom-comps.cell-view',
    name: 'CellView',
    description: 'Single cell with idle/edit modes',
    scheme: {
        type: 'number',
        table: 'object',
        model: 'object',
        rowId: 'number',
        colId: 'string',
        targetTableUuid: 'string',
        validator: 'function'
    }
};

DOM.register(ctor, (role) => {
    role('CellView', ICellView, true);
}, info);

export default info.clsid;