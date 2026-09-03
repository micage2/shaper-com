import { DomRegistry as DOM } from '../dom-registry.js';

function ctor(args = {}) {
    const self = this;
    
    const host = document.createElement('div');
    host.style.cssText = 'display:flex !important; flex-direction:column !important; width:100% !important; height:100% !important; overflow-y:auto !important; overflow-x:hidden !important; box-sizing:border-box !important;';
    
    const fields = new Map(); // string -> HTMLElement (prop field)
    
    function createField(name, cell) {
        const field = document.createElement('div');
        field.style.cssText = 'display:flex; align-items:center; padding:4px 8px; border-bottom:1px solid #eee;';
        
        const label = document.createElement('span');
        label.style.cssText = 'flex:0 0 120px; font-size:13px; color:#333; font-family: Segoe UI, Arial, sans-serif;';
        label.textContent = name;
        field.appendChild(label);
        
        const valueContainer = document.createElement('div');
        valueContainer.style.cssText = 'flex:1;';
        field.appendChild(valueContainer);
        
        fields.set(name, {field, cell});
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

const typeIds = [1, 2, 3, 42];
const typeStrings = ['string', 'number', 'boolean', 'link'];
const input_types = ['text', 'number', 'checkbox', ''];

const IPropertyView = (instance) => ({
    addProperty(prop) {
        const typeIndex = typeIds.indexOf(prop.type);
        if (typeIndex < 0) {
            console.warn('Invalid datatype', prop.type);
            return null;
        }
        const container = instance.createField(prop.name, prop);
        let child;
        if (prop.type !== 42) {
            child = document.createElement('input');
            child.type = input_types[typeIndex];
            child.value = prop.value;
            child.checked = prop.type === 3 ? prop.value : '';
        }
        else {
            child = document.createElement('select');
            for (const option of prop.options || []) {
                const opt = document.createElement('option');
                opt.value = String(option.idx);
                opt.textContent = option.name;
                child.appendChild(opt);
            }
            child.value = String(prop.value);
        }
        child.addEventListener('blur', () => {
            if (prop.type === 1) prop.value = child.value;
            else if (prop.type === 2) prop.value = Number(child.value);
            else if (prop.type === 3) prop.value = child.checked || false;
            else if (prop.type === 42) prop.value = Number(child.value);
            this.emit('value-changed', prop);
        });
        
        container.appendChild(child);
        return this;                
    },

    remove(name) {
        const entry = instance.fields.get(name);
        if (entry.field) {
            entry.field.remove();
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