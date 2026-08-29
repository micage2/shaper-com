import { DomRegistry as DOM } from '../dom-registry.js';

function ctor(args = {}) {
    const self = this;
    
    const host = document.createElement('div');
    host.style.cssText = 'display:flex !important; flex-direction:column !important; width:100% !important; height:100% !important; overflow-y:auto !important; overflow-x:hidden !important; box-sizing:border-box !important;';
    
    const fields = new Map();
    
    function createField(name) {
        const field = document.createElement('div');
        field.style.cssText = 'display:flex; align-items:center; padding:4px 8px; border-bottom:1px solid #eee;';
        
        const label = document.createElement('span');
        label.style.cssText = 'flex:0 0 120px; font-size:13px; color:#333; font-family: Segoe UI, Arial, sans-serif;';
        label.textContent = name;
        field.appendChild(label);
        
        const valueContainer = document.createElement('div');
        valueContainer.style.cssText = 'flex:1;';
        field.appendChild(valueContainer);
        
        fields.set(name, field);
        host.appendChild(field);
        
        return valueContainer;
    }
    
    return {
        getHost() { return host; },
        getInstance() { 
            return { 
                host,
                fields,
                createField
            }; 
        }
    };
}

const IPropertyView = (instance) => ({
    addNumber(name, value) {
        const container = instance.createField(name);
        const input = document.createElement('input');
        input.type = 'number';
        input.value = value !== null && value !== undefined ? String(value) : '';
        input.addEventListener('blur', () => {
            this.emit('value-changed', { name, value: Number(input.value) });
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            }
        });
        container.appendChild(input);
        return this;
    },
    
    addString(name, value) {
        const container = instance.createField(name);
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value !== null && value !== undefined ? String(value) : '';
        input.addEventListener('blur', () => {
            this.emit('value-changed', { name, value: input.value });
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                input.blur();
            }
        });
        container.appendChild(input);
        return this;
    },
    
    addBoolean(name, value) {
        const container = instance.createField(name);
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = value || false;
        checkbox.addEventListener('change', () => {
            this.emit('value-changed', { name, value: checkbox.checked });
        });
        container.appendChild(checkbox);
        return this;
    },
    
    addLink(name, options, value) {
        const container = instance.createField(name);
        const select = document.createElement('select');
        
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = '';
        select.appendChild(emptyOption);
        
        for (const option of options || []) {
            const opt = document.createElement('option');
            opt.value = String(option.idx);
            opt.textContent = option.name;
            select.appendChild(opt);
        }
        
        if (value !== null && value !== undefined) {
            select.value = String(value);
        }
        
        select.addEventListener('change', () => {
            const newValue = select.value === '' ? null : Number(select.value);
            this.emit('value-changed', { name, value: newValue });
        });
        
        container.appendChild(select);
        return this;
    },
    
    remove(name) {
        const field = instance.fields.get(name);
        if (field) {
            field.remove();
            instance.fields.delete(name);
        }
        return this;
    }
});

const info = {
    clsid: 'jscom.dom-comps.property-view',
    name: 'PropertyView',
    description: 'Dynamic container of property fields'
};

DOM.register(ctor, (role) => {
    role('PropertyView', IPropertyView, true);
}, info);

export default info.clsid;