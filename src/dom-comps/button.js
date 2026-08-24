import { DomRegistry as DOM } from '../dom-registry.js';
import { loadFragment } from '../shared/dom-helper.js';

const html_file = "./src/dom-comps/button.html";
const fragment = await loadFragment(html_file);

function ctor(args = {}) {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'closed' });
    
    const clone = fragment.cloneNode(true);
    shadow.appendChild(clone);
    
    const button = shadow.querySelector('.btn');
    button.textContent = args.label || '';
    
    if (args.onClick) {
        button.addEventListener('click', args.onClick);
    }
    
    return {
        getHost() { return host; },
        getInstance() { return { button, host }; }
    };
}

const IButton = (instance) => ({
    setLabel(label) {
        instance.button.textContent = label;
        return this;
    },
    
    setActive(active) {
        if (active) {
            instance.button.classList.add('active');
        } else {
            instance.button.classList.remove('active');
        }
        return this;
    },
    
    setEnabled(enabled) {
        instance.button.disabled = !enabled;
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