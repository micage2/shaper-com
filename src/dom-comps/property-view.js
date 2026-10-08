import { DomRegistry as DOM } from '../dom-registry.js';

function ctor(args = {}) {
    const self = this;
    
    const host = document.createElement('div');
    host.style.cssText = `
        display:flex !important;
        flex-direction:column !important;
        width:100% !important;
        height:100% !important;
        overflow-y:auto !important;
        overflow-x:hidden !important;
        box-sizing:border-box !important;
    `;

    const caption = document.createElement('div');
    const caption_text =  document.createElement('span');
    caption.style.cssText = `
        height: 44px; 
        text-align: center; 
        padding: 8px; 
        font-size: 22px;
        border-bottom: 1px solid var(--border);
    `;
    caption_text.textContent = args.caption;
    caption.appendChild(caption_text);
    host.appendChild(caption);
    
    const fields = new Map();
    
    function createField(key, cell) {
        const field = document.createElement('div');
        field.style.cssText = `
            display:flex;
            width: 100%;
            height: 40px;
            align-items:center; 
            padding: 0px 1px; 
            border-bottom: 1px solid var(--border);
        `;
        
        const label = document.createElement('span');
        label.style.cssText = `
            flex:0 0 120px; 
            font-size:13px;
            color: var(--text);
            font-family: Segoe UI, Arial, sans-serif;
            padding: 6px 12px;
            text-align: right;
            user-select: none;
        `;
        label.textContent = cell.name + ':';
        field.appendChild(label);
        
        const valueContainer = document.createElement('div');
        valueContainer.style.cssText = `
            height: 100%;
            flex:1;
        `;
        field.appendChild(valueContainer);
        
        fields.set(key, { field, cell });
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
    // name, type, value
    add(prop) {
        // console.info('💡', '[IPropertyView.add]', prop);

        const typeIndex = typeIds.indexOf(prop.type);
        if (typeIndex < 0) {
            console.warn('Invalid datatype', prop.type);
            return null;
        }
        if (instance.fields.has(prop.colId)) return null;
        
        const container = instance.createField(prop.colId, prop);
        let child;
        
        if (prop.type !== 42) {
            child = document.createElement('input');
            child.style.cssText = `
                background-color: transparent;
            `;
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
                opt.value = String(option.value);
                opt.textContent = option.label;
                child.appendChild(opt);
            }
            if (prop.value !== null && prop.value !== undefined) {
                child.value = String(prop.value);
            }
        }

        child.style.cssText = `
            width: 100%;
            height: 100%;
            border: 0;
            text-align: left;
            background-color: var(--bg);
            padding: 0 8px;
        `;
        if (prop.type === 3) child.style.width = '';
        
        child.addEventListener('change', () => {
            const oldValue = prop.value;
            let newValue;
            
            if (prop.type === 1) newValue = child.value;
            else if (prop.type === 2) newValue = Number(child.value);
            // @ts-ignore
            else if (prop.type === 3) newValue = child.checked || false;
            else if (prop.type === 42) newValue = Number(child.value);
            
            prop.value = newValue;
            
            this.emit('value-changed', {
                // tableUuid: prop.tableUuid,
                colId: prop.colId,
                // rowId: prop.rowId,
                oldValue: oldValue,
                value: newValue
            });
        });
        
        container.appendChild(child);
        return this;
    },
    
    remove(key) {
        const entry = instance.fields.get(key);
        if (entry && entry.field) {
            entry.field.remove();
            instance.fields.delete(key);
        }
        return this;
    },
    
    set(key, value) {
        const entry = instance.fields.get(key);
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
    },

    rename(col) {
        const entry = instance.fields.get(col.id);
        if (entry) {
            entry.cell.name = col.newName;
            entry.field.querySelector('span').textContent = col.newName + ':';
        }
    },
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
