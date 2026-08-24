import { DomRegistry as DOM } from '../dom-registry.js';
import { loadFragment } from '../shared/dom-helper.js';

const html_file = "./src/dom-comps/toolbar.html";
const fragment = await loadFragment(html_file);

function ctor(args = {}) {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'closed' });
    
    const clone = fragment.cloneNode(true);
    shadow.appendChild(clone);
    
    return {
        getHost() { return host; },
        getInstance() { return {}; }
    };
}

const IToolbar = (instance) => ({
    add(child) {
        DOM.attach(child, this);
        return this;
    }
});

const info = {
    clsid: 'jscom.dom-comps.toolbar',
    name: 'Toolbar',
    description: 'Simple horizontal container'
};

DOM.register(ctor, (role) => {
    role('Toolbar', IToolbar, true);
}, info);

export default info.clsid;