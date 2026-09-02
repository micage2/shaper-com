// src/dom-comps/edit-toggle-box.js

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
    
    function addSectionLabel(section, labelText) {
        if (!labelText) return;
        
        const label = document.createElement('span');
        label.className = 'section-label';
        label.textContent = labelText;
        label.style.cssText = 'font-size: var(--control-font-size, 12px); color: #666; margin-right: 4px; user-select: none;';
        section.insertBefore(label, section.firstChild);
    }
    
    addSectionLabel(leftSection, args.leftLabel);
    addSectionLabel(centerSection, args.centerLabel);
    addSectionLabel(rightSection, args.rightLabel);
    
    return {
        getHost() { return host; },
        getInstance() { return { host, leftSection, centerSection, rightSection, wrappers }; }
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
        
        editToggleIface.on('edit', () => {
            for (const [iface, w] of instance.wrappers) {
                if (iface !== editToggleIface) {
                    w.style.display = 'none';
                }
            }

            // instance.leftSection.firstChild.style.display = 'none';
            instance.centerSection.firstChild.style.display = 'none';
            instance.rightSection.firstChild.style.display = 'none';
        });
        
        editToggleIface.on('idle', () => {
            for (const w of instance.wrappers.values()) {
                w.style.display = '';
            }
            // instance.leftSection.firstChild.style.display = '';
            instance.centerSection.firstChild.style.display = '';
            instance.rightSection.firstChild.style.display = '';
        });
        
        return this;
    }

});

const info = {
    clsid: 'jscom.dom-comps.edit-toggle-box',
    name: 'EditToggleBox',
    description: 'Container for EditToggles with exclusive edit mode',
    scheme: {
        leftLabel: 'string',
        centerLabel: 'string',
        rightLabel: 'string'
    }
};

DOM.register(ctor, (role) => {
    role('EditToggleBox', IEditToggleBox, true);
}, info);

export default info.clsid;