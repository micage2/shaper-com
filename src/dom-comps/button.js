import { DomRegistry as DOM } from '../dom-registry.js';

function ctor(args = {}) {
    const host = document.createElement('button');
    host.style.cssText = `
        height: var(--control-height, 28px); 
        padding: var(--control-padding, 4px 12px); 
        border: var(--control-border, 1px solid #ccc); 
        border-radius: var(--control-radius, 4px); 
        font-size: var(--control-font-size, 12px); 
        /* background: #fff; */
        cursor: pointer; 
        white-space:nowrap; 
        font-family: Segoe UI, Arial, sans-serif;
    `;
    host.textContent = args.label || '';
    
    host.addEventListener('click', () => this.emit('clicked'));
    
    return {
        getHost() { return host; },
        getInstance() { return { host }; }
    };
}

const IButton = ({host}) => ({
    setLabel(label) {
        host.textContent = label;
        return this;
    },
    
    setActive(active) {
        if (active) {
            host.classList.add('active');
        } else {
            host.classList.remove('active');
        }
        return this;
    },
    
    setEnabled(enabled) {
        host.disabled = !enabled;
        return this;
    },

    click() {
        host.click();
    },

    hide() {
        host.style.display = 'none';
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