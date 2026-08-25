import { DomRegistry as DOM } from '../dom-registry.js';

function ctor(iRowData) {
    const host = document.createElement('div');
    host.style.cssText = 'display:flex !important; flex-direction:column !important; width:100% !important; height:100% !important; overflow:auto !important; box-sizing:border-box !important;';
    
    function createField(column, value) {
        const field = document.createElement('div');
        field.style.cssText = 'display:flex; align-items:center; padding:4px 8px; border-bottom:1px solid #eee;';
        
        const label = document.createElement('span');
        label.style.cssText = 'flex:0 0 120px; font-size:13px; color:#333;';
        label.textContent = column.name;
        field.appendChild(label);
        
        const valueContainer = document.createElement('div');
        valueContainer.style.cssText = 'flex:1;';
        
        if (column.type === 3) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = value || false;
            checkbox.addEventListener('change', () => {
                iRowData.setValue(column.colId, checkbox.checked);
            });
            valueContainer.appendChild(checkbox);
        } else if (column.type === 42) {
            const select = document.createElement('select');
            const linkInfo = iRowData.getLinkInfo(column.colId);
            
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = '';
            select.appendChild(emptyOption);
            
            if (linkInfo) {
                for (const option of linkInfo) {
                    const opt = document.createElement('option');
                    opt.value = String(option.idx);
                    opt.textContent = option.name;
                    select.appendChild(opt);
                }
            }
            
            if (value !== null && value !== undefined) {
                select.value = String(value);
            }
            
            select.addEventListener('change', () => {
                const newValue = select.value === '' ? null : Number(select.value);
                iRowData.setValue(column.colId, newValue);
            });
            
            valueContainer.appendChild(select);
        } else {
            const input = document.createElement('input');
            input.type = column.type === 2 ? 'number' : 'text';
            input.value = value !== null && value !== undefined ? String(value) : '';
            
            input.addEventListener('blur', () => {
                const newValue = column.type === 2 ? Number(input.value) : input.value;
                iRowData.setValue(column.colId, newValue);
            });
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    input.blur();
                }
            });
            
            valueContainer.appendChild(input);
        }
        
        field.appendChild(valueContainer);
        return field;
    }
    
    function display() {
        host.innerHTML = '';
        
        const columns = iRowData.getColumns();
        for (const column of columns) {
            const value = iRowData.getValue(column.colId);
            host.appendChild(createField(column, value));
        }
    }
    
    iRowData.onValueChanged(() => {
        display();
    });
    
    display();
    
    return {
        getHost() { return host; },
        getInstance() { return { display }; }
    };
}

const IPropertyView = (instance) => ({
    refresh() {
        instance.display();
        return this;
    }
});

const info = {
    clsid: 'jscom.dom-comps.property-view',
    name: 'PropertyView',
    description: 'Form-style view of a single row'
};

DOM.register(ctor, (role) => {
    role('PropertyView', IPropertyView, true);
}, info);

export default info.clsid;