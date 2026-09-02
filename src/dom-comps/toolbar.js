import { DomRegistry as DOM } from '../dom-registry.js';

function ctor(args = {}) {
    const host = document.createElement('div');
    host.style.cssText = 'display:flex !important; align-items:center !important; width:100% !important; height:100% !important; gap:8px !important; padding:8px 16px !important; box-sizing:border-box !important; background:#f8f8f8 !important; border-bottom:1px solid #e0e0e0 !important;';
    
    host.style.setProperty('--control-height', '28px');
    host.style.setProperty('--control-padding', '4px 12px');
    host.style.setProperty('--control-border', '1px solid #ccc');
    host.style.setProperty('--control-radius', '4px');
    host.style.setProperty('--control-font-size', '12px');
    
    return {
        getHost() { return host; },
        getInstance() { return {}; }
    };
}

const IToolbar = (instance) => ({
    add(child, options = {}) {
        if (options.after) {
            DOM.attach(child, options.after, { mode: 'after' });
        }
        else {
            DOM.attach(child, this);
        }
        return this;
    },
    remove(child) {
        DOM.detach(child, this);
        return child;
    }
});

const info = {
    clsid: 'jscom.dom-comps.toolbar',
    name: 'Toolbar',
    description: 'Simple horizontal container with control theme'
};

DOM.register(ctor, (role) => {
    role('Toolbar', IToolbar, true);
}, info);

export default info.clsid;