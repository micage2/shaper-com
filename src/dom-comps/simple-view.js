import { DomRegistry as DOM } from '../dom-registry.js';
import { loadFragment } from '../shared/dom-helper.js';

const html_file = "./src/dom-comps/simple-view.html";
const fragment = await loadFragment(html_file);

function ctor(args = {}) {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'closed' });
    
    const clone = fragment.cloneNode(true);
    shadow.appendChild(clone);
    
    const content = shadow.querySelector('.content');
    content.textContent = args.title || '';
    
    return {
        getHost() { return host; },
        getInstance() { return { content }; }
    };
}

const ISimpleView = (instance) => ({
    setTitle(title) {
        instance.content.textContent = title;
        return this;
    }
});

const info = {
    clsid: 'jscom.dom-comps.simple-view',
    name: 'SimpleView',
    description: 'Simple content display component'
};

DOM.register(ctor, (role) => {
    role('SimpleView', ISimpleView, true);
}, info);

export default info.clsid;
