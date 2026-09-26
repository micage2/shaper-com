// src/dom-comps/label.js
import { DomRegistry as DOM } from '../dom-registry.js';

function ctor(args = {}) {
    const host = document.createElement('span');
    host.textContent = args.text || '';
    host.style.cssText = `
        font-size: var(--main-font-size, 12px);
        color: var(--text, #888);
        background-color: var(--border);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 7px 8px;
    `;
    
    return {
        getHost() { return host; },
        getInstance() { return host; }
    };
}

const ILabel = (host) => ({
    setText(text) {
        host.textContent = text;
        return this;
    },
    
    getText() {
        return host.textContent;
    }
});

const info = {
    clsid: 'jscom.dom-comps.label',
    name: 'Label',
    description: 'Simple text label',
    scheme: {
        text: 'string'
    }
};

DOM.register(ctor, (role) => {
    role('Label', ILabel, true);
}, info);

export default info.clsid;