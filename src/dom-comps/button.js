import { DomRegistry as DOM } from '../dom-registry.js';
import { LoadStyle } from '../shared/dom-helper.js';
import { GetSVGIcon } from "../shared/icons.js";

const html_file = "./src/dom-comps/button.html";
LoadStyle(html_file);

function ctor(args = {}) {
    const button = document.createElement('button');
    
    const size = args.size ? `${args.size}px` : `var(--control-font-size, 12px)`;
    button.textContent = args.label || '';
    
    button.addEventListener('click', () => this.emit('clicked'));
    
    return {
        getHost() { return button; },
        getInstance() { return button; }
    };
}

const IButton = (button) => ({
    setLabel(label) {
        button.textContent = label;
        return this;
    },

    setIcon(svg) {
        button.innerHTML = GetSVGIcon(svg);
        // button.textContent = '';
    },
    
    setActive(active) {
        if (active) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
        return this;
    },
    
    setEnabled(enabled) {
        button.disabled = !enabled;
        return this;
    },

    click() {
        button.click();
    },

    hide() {
        button.style.display = 'none';
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