import { DomRegistry as DOM } from '../dom-registry.js';

function ctor(args = {}) {
    const host = document.createElement('div');
    host.style.cssText = 'display:contents;';
    
    const child = args.child || null;
    
    return {
        getHost() { return host; },
        getInstance() { return {}; },
        postCreate() {
            if (child) {
                DOM.attach(child, this);
            }
        }
    };
}

const info = {
    clsid: 'jscom.dom-comps.shell',
    name: 'Shell',
    description: 'Invisible compound root',
    scheme: {
        child: { type: 'object', required: false }
    }
};

DOM.register(ctor, () => {}, info);

export default info.clsid;