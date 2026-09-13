import { DomRegistry as DOM } from '../dom-registry.js';
import { loadFragment } from '../shared/dom-helper.js';
import EditToggle from './edit-toggle.js';

const html_file = "./src/dom-comps/edit-toggle-box.html";
const fragment = await loadFragment(html_file);

function ctor(args = {}) {
    const self = this;

    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'closed' });
    const clone = fragment.cloneNode(true);
    shadow.appendChild(clone);

    const wrappers = new Map();
    const toggles = new Map();

    const leftSection = shadow.querySelector('.section-left');
    const centerSection = shadow.querySelector('.section-center');
    const rightSection = shadow.querySelector('.section-right');

    function getSection(position) {
        if (position === 'left') return leftSection;
        if (position === 'right') return rightSection;
        return centerSection;
    }

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
        getInstance() {
            return {
                shadow,
                leftSection,
                centerSection,
                rightSection,
                toggles,
                wrappers,
                activeToggle: null
            };
        }
    };
}

const IEditToggleBox = (instance) => ({
    add(name, position = 'center', idle, edit = null) {
        const toggle = DOM.create(EditToggle, { idle, edit });

        if (!toggle) return this;

        instance.toggles.set(name, toggle);

        const wrapper = document.createElement('div');
        wrapper.className = 'toggle-wrapper';

        const slot = document.createElement('slot');
        slot.name = `slot-${instance.toggles.size}`;
        wrapper.appendChild(slot);

        instance.wrappers.set(toggle, wrapper);

        if (position === 'left') {
            instance.leftSection.appendChild(wrapper);
        } else if (position === 'right') {
            instance.rightSection.appendChild(wrapper);
        } else {
            instance.centerSection.appendChild(wrapper);
        }

        DOM.attach(toggle, this, { slot: slot.name });

        toggle.on('edit', () => {
            instance.activeToggle = toggle;
            for (const [t, w] of instance.wrappers) {
                if (t !== toggle) {
                    w.style.display = 'none';
                }
            }

            // Hide section label
            // instance.leftSection.style.display = 'none';
            // instance.centerSection.style.display = 'none';
            // instance.rightSection.style.display = 'none';
            instance.shadow.querySelectorAll('.section span').forEach(label => {
                label.style.display = 'none';
            });

        });

        toggle.on('idle', () => {
            if (instance.activeToggle === toggle) {
                instance.activeToggle = null;
            }
            for (const w of instance.wrappers.values()) {
                w.style.display = '';
            }

            // Show all section labels
            instance.shadow.querySelectorAll('.section span').forEach(label => {
                label.style.display = '';
            });
        });

        idle?.on('close', (data) => {
            this.emit('idle-closed', { name, data });
        });

        edit?.on('close', (data) => {
            this.emit('edit-closed', { name, data });
        });

        return this;
    },

    setIdle(name, idleComp) {
        const toggle = instance.toggles.get(name);
        if (toggle) {
            toggle.setIdleCompound(idleComp);
        }
        return this;
    },

    setEdit(name, editComp) {
        const toggle = instance.toggles.get(name);
        if (toggle) {
            toggle.setEditCompound(editComp);
        }
        return this;
    },

    closeActive() {
        if (instance.activeToggle) {
            instance.activeToggle.showIdle();
        }
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
