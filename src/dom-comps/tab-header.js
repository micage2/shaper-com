import { DomRegistry as DOM } from '../dom-registry.js';
import { loadFragment } from '../shared/dom-helper.js';

const html_file = "./src/dom-comps/tab-header.html";
const fragment = await loadFragment(html_file);

function ctor(args = {}) {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'closed' });
    
    const clone = fragment.cloneNode(true);
    shadow.appendChild(clone);
    
    const icon = shadow.querySelector('.icon');
    const label = shadow.querySelector('.label');
    const closeBtn = shadow.querySelector('.close-btn');
    closeBtn.innerHTML = `
        <svg viewBox="0 0 10 10">
            <path d="M1 1 L9 9 M9 1 L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
    `;

    
    icon.textContent = args.icon || '🥝';
    label.textContent = args.label || '';
    
    if (args.onClick) {
        host.addEventListener('click', (e) => {
            if (e.target !== closeBtn) {
                args.onClick();
            }
        });
    }
    
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (args.onClose) {
            args.onClose();
        }
    });
    
    return {
        getHost() { return host; },
        getInstance() { return { host, icon, label, closeBtn }; }
    };
}

const ITabHeader = (instance) => ({
    setActive(active) {
        if (active) {
            instance.host.classList.add('active');
        } else {
            instance.host.classList.remove('active');
        }
        return this;
    },
    
    setLabel(text) {
        instance.label.textContent = text;
        return this;
    }
});

const info = {
    clsid: 'jscom.dom-comps.tab-header',
    name: 'TabHeader',
    description: 'Tab header with icon, label, and close button'
};

DOM.register(ctor, (role) => {
    role('TabHeader', ITabHeader, true);
}, info);

export default info.clsid;