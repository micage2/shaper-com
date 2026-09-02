import { DomRegistry as DOM } from '../dom-registry.js';
import { loadFragment } from '../shared/dom-helper.js';

const html_file = "./src/dom-comps/top-bottom-static.html";
const fragment = await loadFragment(html_file);

function ctor(args = {}) {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'closed' });
    
    const clone = fragment.cloneNode(true);
    shadow.appendChild(clone);
    
    const topPane = shadow.querySelector('.top-pane');
    const bottomPane = shadow.querySelector('.bottom-pane');
    
    if (args.topHeight !== undefined) {
        topPane.style.height = args.topHeight + 'px';
        topPane.style.flexShrink = '0';
        bottomPane.style.flex = '1';
    } else if (args.bottomHeight !== undefined) {
        bottomPane.style.height = args.bottomHeight + 'px';
        bottomPane.style.flexShrink = '0';
        topPane.style.flex = '1';
    } else {
        topPane.style.flex = '1';
        bottomPane.style.flex = '1';
    }
    
    return {
        getHost() { return host; },
        getInstance() { return { topPane, bottomPane }; },
        postCreate(instance) {
            if (args.top) {
                DOM.attach(args.top, this, { slot: 'top' });
            }
            if (args.bottom) {
                DOM.attach(args.bottom, this, { slot: 'bottom' });
            }
        }
    };
}

const ITopBottomStatic = (instance) => ({
    setTop(child) {
        if (instance.topPane) {
            DOM.detach(instance.topPane);
        }
        DOM.attach(child, this, { slot: 'top' });
        instance.topPane = child;
        return this;
    },
    
    setBottom(child) {
        if (instance.bottomPane) {
            DOM.detach(instance.bottomPane);
        }
        DOM.attach(child, this, { slot: 'bottom' });
        instance.bottomPane = child;
        return this;
    }    
});

const info = {
    clsid: 'jscom.dom-comps.top-bottom-static',
    name: 'TopBottomStatic',
    description: 'Static vertical splitter with fixed top or bottom height'
};

DOM.register(ctor, (role) => {
    role('TopBottomStatic', ITopBottomStatic, true);
}, info);

export default info.clsid;