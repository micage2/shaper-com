import { DomRegistry as DOM } from '../dom-registry.js';

function ctor(iCellData) {
    const host = document.createElement('div');
    host.className = 'cell-view';
    
    const idleContainer = document.createElement('div');
    idleContainer.className = 'idle-container';
    host.appendChild(idleContainer);
    
    const editContainer = document.createElement('div');
    editContainer.className = 'edit-container';
    editContainer.style.display = 'none';
    host.appendChild(editContainer);
    
    function showIdle() {
        idleContainer.innerHTML = '';
        
        const type = iCellData.getType();
        const value = iCellData.getValue();
        
        if (type === 3) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = value || false;
            checkbox.addEventListener('change', () => {
                iCellData.setValue(checkbox.checked);
            });
            idleContainer.appendChild(checkbox);
        } else if (type === 42) {
            const span = document.createElement('span');
            const linkInfo = iCellData.getLinkInfo();
            if (linkInfo && value !== null && value !== undefined) {
                const option = linkInfo.find(opt => opt.idx === value);
                span.textContent = option ? option.name : `Invalid (${value})`;
            }
            idleContainer.appendChild(span);
        } else {
            const span = document.createElement('span');
            span.textContent = value !== null && value !== undefined ? String(value) : '';
            idleContainer.appendChild(span);
        }
        
        idleContainer.style.display = 'block';
        editContainer.style.display = 'none';
    }
    
    function showEdit() {
        editContainer.innerHTML = '';
        
        const type = iCellData.getType();
        const value = iCellData.getValue();
        
        if (type === 3) {
            return;
        } else if (type === 42) {
            const select = document.createElement('select');
            
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = '';
            select.appendChild(emptyOption);
            
            const linkInfo = iCellData.getLinkInfo();
            if (linkInfo) {
                for (const option of linkInfo) {
                    const opt = document.createElement('option');
                    opt.value = String(option.idx);
                    opt.textContent = `${option.idx}: ${option.name}`;
                    select.appendChild(opt);
                }
            }
            
            if (value !== null && value !== undefined) {
                select.value = String(value);
            }
            
            select.addEventListener('change', () => {
                const newValue = select.value === '' ? null : Number(select.value);
                iCellData.setValue(newValue);
                showIdle();
            });
            
            editContainer.appendChild(select);
        } else {
            const input = document.createElement('input');
            input.type = type === 2 ? 'number' : 'text';
            input.value = value !== null && value !== undefined ? String(value) : '';
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const newValue = type === 2 ? Number(input.value) : input.value;
                    iCellData.setValue(newValue);
                    showIdle();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    showIdle();
                }
            });
            
            input.addEventListener('blur', () => {
                const newValue = type === 2 ? Number(input.value) : input.value;
                iCellData.setValue(newValue);
                showIdle();
            });
            
            editContainer.appendChild(input);
        }
        
        idleContainer.style.display = 'none';
        editContainer.style.display = 'block';
        
        const input = editContainer.querySelector('input, select');
        if (input) {
            input.focus();
            input.select();
        }
    }
    
    const type = iCellData.getType();
    if (type !== 3 && type !== 99) {
        idleContainer.addEventListener('dblclick', showEdit);
    }
    
    iCellData.onValueChanged(() => {
        showIdle();
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
    description: 'Single cell with idle/edit modes'
};

DOM.register(ctor, (role) => {
    role('CellView', ICellView, true);
}, info);

export default info.clsid;