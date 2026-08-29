import { DomRegistry as DOM } from '../dom-registry.js';
import { loadFragment } from '../shared/dom-helper.js';

const html_file = "./src/dom-comps/top-bottom.html";
const fragment = await loadFragment(html_file);

function ctor(args = {}) {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'closed' });
    
    const clone = fragment.cloneNode(true);
    shadow.appendChild(clone);
    
    const topPane = shadow.querySelector('.top-pane');
    const bottomPane = shadow.querySelector('.bottom-pane');
    const divider = shadow.querySelector('.divider');
    
    let ratio = args.ratio ?? 0.5;
    const minTop = args.minTop || 50;
    const minBottom = args.minBottom || 50;
    let isDragging = false;
    
    function update() {
        const total = host.offsetHeight;
        const dividerHeight = divider.offsetHeight;
        const availableHeight = total - dividerHeight;
        
        let topHeight = Math.min(availableHeight - minBottom, Math.max(minTop, availableHeight * ratio));
        let bottomHeight = availableHeight - topHeight;
        
        topPane.style.height = topHeight + 'px';
        bottomPane.style.height = bottomHeight + 'px';
    }
    
    divider.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        isDragging = true;
        divider.classList.add('dragging');
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
    });
    
    function onMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        
        const rect = host.getBoundingClientRect();
        const currentY = e.clientY - rect.top;
        const dividerHeight = divider.offsetHeight;
        ratio = (currentY - dividerHeight / 2) / (rect.height - dividerHeight);
        
        update();
    }
    
    function onUp() {
        isDragging = false;
        divider.classList.remove('dragging');
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
    }
    
    new ResizeObserver(update).observe(host);
    
    return {
        getHost() { return host; },
        getInstance() { return { update, topChild: args.top, bottomChild: args.bottom }; },
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

const ITopBottom = (instance) => ({
    setTop(child) {
        if (instance.topChild) {
            DOM.detach(instance.topChild);
        }
        DOM.attach(child, this, { slot: 'top' });
        instance.topChild = child;
        return this;
    },
    
    setBottom(child) {
        if (instance.bottomChild) {
            DOM.detach(instance.bottomChild);
        }
        DOM.attach(child, this, { slot: 'bottom' });
        instance.bottomChild = child;
        return this;
    }    
});

const info = {
    clsid: 'jscom.dom-comps.top-bottom',
    name: 'TopBottom',
    description: 'Vertical splitter with top and bottom panes'
};

DOM.register(ctor, (role) => {
    role('TopBottom', ITopBottom, true);
}, info);

export default info.clsid;