import { DomRegistry as DOM } from '../dom-registry.js';

function ctor(args = {}) {
    const host = document.createElement('button');
    host.style.cssText = 'padding:6px 12px; border:1px solid #ccc; background:#fff; cursor:pointer; font-size:12px; font-family:Segoe UI, Arial, sans-serif; border-radius:4px; white-space:nowrap;';
    host.textContent = args.label || '';
    
    if (args.onClick) {
        host.addEventListener('click', args.onClick);
    }
    
    return {
        getHost() { return host; },
        getInstance() { return { host }; }
    };
}

const IButton = (instance) => ({
    setLabel(label) {
        instance.host.textContent = label;
        return this;
    },
    
    setActive(active) {
        if (active) {
            instance.host.classList.add('active');
        } else {
            instance.host.classList.remove('active');
        }
        return this;
    },
    
    setEnabled(enabled) {
        instance.host.disabled = !enabled;
        return this;
    }
});

const info = {
    clsid: 'jscom.dom-comps.button',
    name: 'Button',
    description: 'Simple clickable button'
};

DOM.register(ctor, (role) => {
    role('Button', IButton, true);
}, info);

export default info.clsid;