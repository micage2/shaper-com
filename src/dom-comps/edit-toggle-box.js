import { DomRegistry as DOM } from '../dom-registry.js';
import { loadFragment } from '../shared/dom-helper.js';

const html_file = "./src/dom-comps/edit-toggle-box.html";
const fragment = await loadFragment(html_file);

function ctor(args = {}) {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'closed' });
    
    const clone = fragment.cloneNode(true);
    shadow.appendChild(clone);
    
    const wrappers = new Map();
    
    const leftSection = shadow.querySelector('.section-left');
    const centerSection = shadow.querySelector('.section-center');
    const rightSection = shadow.querySelector('.section-right');
    
    return {
        getHost() { return host; },
        getInstance() { return { leftSection, centerSection, rightSection, wrappers }; }
    };
}

const IEditToggleBox = (instance) => ({
    add(editToggleIface, position = 'center') {
        const wrapper = document.createElement('div');
        wrapper.className = 'toggle-wrapper';
        
        const slot = document.createElement('slot');
        slot.name = `slot-${instance.wrappers.size}`;
        wrapper.appendChild(slot);
        
        instance.wrappers.set(editToggleIface, wrapper);
        
        if (position === 'left') {
            instance.leftSection.appendChild(wrapper);
        } else if (position === 'right') {
            instance.rightSection.appendChild(wrapper);
        } else {
            instance.centerSection.appendChild(wrapper);
        }
        
        DOM.attach(editToggleIface, this, { slot: slot.name });
        
        editToggleIface.on('edit-toggle.edit', () => {
            for (const [iface, w] of instance.wrappers) {
                if (iface !== editToggleIface) {
                    w.style.display = 'none';
                }
            }
        });
        
        editToggleIface.on('edit-toggle.idle', () => {
            for (const w of instance.wrappers.values()) {
                w.style.display = '';
            }
        });
        
        return this;
    }

});

const info = {
    clsid: 'jscom.dom-comps.edit-toggle-box',
    name: 'EditToggleBox',
    description: 'Container for EditToggles with exclusive edit mode'
};

DOM.register(ctor, (role) => {
    role('EditToggleBox', IEditToggleBox, true);
}, info);

export default info.clsid;
