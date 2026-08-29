import { DomRegistry as DOM } from '../dom-registry.js';
import { loadFragment } from '../shared/dom-helper.js';

const html_file = "./src/dom-comps/left-right.html";
const fragment = await loadFragment(html_file);

function ctor(args = {}) {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'closed' });
    
    const clone = fragment.cloneNode(true);
    shadow.appendChild(clone);
    
    const leftPane = shadow.querySelector('.left-pane');
    const rightPane = shadow.querySelector('.right-pane');
    const divider = shadow.querySelector('.divider');
    
    let ratio = args.ratio ?? 0.5;
    const minLeft = args.minLeft || 100;
    const minRight = args.minRight || 100;
    let isDragging = false;
    
    function update() {
        const total = host.offsetWidth;
        const dividerWidth = divider.offsetWidth;
        const availableWidth = total - dividerWidth;
        
        let leftWidth = Math.min(availableWidth - minRight, Math.max(minLeft, availableWidth * ratio));
        let rightWidth = availableWidth - leftWidth;
        
        leftPane.style.width = leftWidth + 'px';
        rightPane.style.width = rightWidth + 'px';
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
        const currentX = e.clientX - rect.left;
        const dividerWidth = divider.offsetWidth;
        ratio = (currentX - dividerWidth / 2) / (rect.width - dividerWidth);
        
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
        getInstance() { 
            return { 
                update,
                leftChild: null,
                rightChild: null
            }; 
        },
        postCreate(instance) {
            if (args.left) {
                DOM.attach(args.left, this, { slot: 'left' });
                instance.leftChild = args.left;
            }
            if (args.right) {
                DOM.attach(args.right, this, { slot: 'right' });
                instance.rightChild = args.right;
            }
        }
    };
}

const ILeftRight = (instance) => ({
    setLeft(child) {
        if (instance.leftChild) {
            DOM.detach(instance.leftChild);
        }
        DOM.attach(child, this, { slot: 'left' });
        instance.leftChild = child;
        return this;
    },
    
    setRight(child) {
        if (instance.rightChild) {
            DOM.detach(instance.rightChild);
        }
        DOM.attach(child, this, { slot: 'right' });
        instance.rightChild = child;
        return this;
    }
});

const info = {
    clsid: 'jscom.dom-comps.left-right',
    name: 'LeftRight',
    description: 'Horizontal splitter with left and right panes'
};

DOM.register(ctor, (role) => {
    role('LeftRight', ILeftRight, true);
}, info);

export default info.clsid;