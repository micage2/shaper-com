import { DomRegistry as DOM } from '../dom-registry.js';

function ctor(args = {}) {
    const host = document.createElement('select');
    const data = { value: '' };
    
    for (const option of args.options || []) {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.label;
        host.appendChild(opt);
    }
    
    if (args.value !== undefined) {
        host.value = args.value;
    }
    
    if (args.onChange) {
        host.addEventListener('change', () => {
            args.onChange(host.value);
        });
    }
    
    return {
        getHost() { return host; },
        getInstance() { return data; }
    };
}

const ISelectBox = (instance) => ({
    getValue() {
        return instance.value;
    },
    
    setValue(value) {
        instance.value = value;
        return this;
    }
});

const info = {
    clsid: 'jscom.dom-comps.select-box',
    name: 'SelectBox',
    description: 'Simple dropdown selector'
};

DOM.register(ctor, (role) => {
    role('SelectBox', ISelectBox, true);
}, info);

export default info.clsid;