import { DomRegistry as DOM } from '../dom-registry.js';

function ctor(args = {}) {
    const host = document.createElement('select');
    host.style.cssText = 'height: var(--control-height, 28px); padding: var(--control-padding, 4px 12px); border: var(--control-border, 1px solid #ccc); border-radius: var(--control-radius, 4px); font-size: var(--control-font-size, 12px); background:#fff; cursor:pointer; font-family: Segoe UI, Arial, sans-serif;';
    
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
        getInstance() { return { host }; }
    };
}

const ISelectBox = (instance) => ({
    getValue() {
        return instance.host.value;
    },
    
    setValue(value) {
        instance.host.value = value;
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