import { DomRegistry as DOM } from '../dom-registry.js';

function ctor(args = {}) {
    const self = this;
    
    const host = document.createElement('div');
    host.style.cssText = 'display:flex !important; flex-direction:column !important; width:100% !important; height:100% !important; overflow-y:auto !important; overflow-x:hidden !important; box-sizing:border-box !important;';

    const caption = document.createElement('div');
    const caption_text =  document.createElement('span');
    caption.style.cssText = `
        height: 44px; 
        text-align: center; 
        padding: 8px; 
        font-size: 22px;
        border-bottom: 1px solid #ccd;
    `;
    caption_text.textContent = args.caption;
    caption.appendChild(caption_text);
    host.appendChild(caption);
    
    const fields = new Map();
    
    function createField(name, cell) {
        const field = document.createElement('div');
        field.style.cssText = 'display:flex; align-items:center; padding:4px 8px; border-bottom:1px solid #eee;';
        
        const label = document.createElement('span');
        label.style.cssText = `
            flex:0 0 120px; 
            font-size:13px;
            color:#333;
            font-family: Segoe UI, Arial, sans-serif;
            padding: 6px 8px;
            text-align: right;
        `;
        label.textContent = name;
        field.appendChild(label);
        
        const valueContainer = document.createElement('div');
        valueContainer.style.cssText = 'flex:1;';
        field.appendChild(valueContainer);
        
        fields.set(name, { field, cell });
        host.appendChild(field);
        
        return valueContainer;
    }
    
    return {
        getHost() { return host; },
        getInstance() { 
            return { host, fields, createField }; 
        }
    };
}

const typeIds = [1, 2, 3, 42];
const input_types = ['text', 'number', 'checkbox', ''];

const IPropertyView = (instance) => ({
    add(prop) {
        const typeIndex = typeIds.indexOf(prop.type);
        if (typeIndex < 0) {
            console.warn('Invalid datatype', prop.type);
            return null;
        }
        if (instance.fields.has(prop.name)) return null;
        
        const container = instance.createField(prop.name, prop);
        let child;
        
        if (prop.type !== 42) {
            child = document.createElement('input');
            child.type = input_types[typeIndex];
            if (prop.type === 3) {
                child.checked = prop.value || false;
            } else {
                child.value = prop.value !== null && prop.value !== undefined ? prop.value : '';
            }
        } else {
            child = document.createElement('select');
            for (const option of prop.options || []) {
                const opt = document.createElement('option');
                opt.value = String(option.idx);
                opt.textContent = option.name;
                child.appendChild(opt);
            }
            if (prop.value !== null && prop.value !== undefined) {
                child.value = String(prop.value);
            }
        }
        
        child.addEventListener('change', () => {
            const oldValue = prop.value;
            let newValue;
            
            if (prop.type === 1) newValue = child.value;
            else if (prop.type === 2) newValue = Number(child.value);
            else if (prop.type === 3) newValue = child.checked || false;
            else if (prop.type === 42) newValue = Number(child.value);
            
            prop.value = newValue;
            
            this.emit('value-changed', {
                tableUuid: prop.tableUuid,
                colId: prop.colId,
                rowId: prop.rowId,
                oldValue: oldValue,
                value: newValue
            });
        });
        
        container.appendChild(child);
        return this;
    },
    
    remove(name) {
        const entry = instance.fields.get(name);
        if (entry && entry.field) {
            entry.field.remove();
            instance.fields.delete(name);
        }
        return this;
    },
    
    set(name, value) {
        const entry = instance.fields.get(name);
        if (entry) {
            const input = entry.field.querySelector('input, select');
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = value || false;
                } else {
                    input.value = value !== null && value !== undefined ? value : '';
                }
            }
        }
        return this;
    }
});

const info = {
    clsid: 'jscom.dom-comps.property-view',
    name: 'PropertyView',
    description: 'Dynamic container of property fields',
    scheme: {
        caption: { type: 'string', required: true }
    }
};

DOM.register(ctor, (role) => {
    role('PropertyView', IPropertyView, true);
}, info);

export default info.clsid;
