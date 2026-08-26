import { DomRegistry as DOM } from '../dom-registry.js';

function ctor(args = {}) {
    const host = document.createElement('div');
    host.style.cssText = 'display:flex !important; align-items:center !important; width:100% !important; height:100% !important; gap:8px !important; padding:8px 16px !important; box-sizing:border-box !important; background:#f8f8f8 !important; border-bottom:1px solid #e0e0e0 !important;';
    
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