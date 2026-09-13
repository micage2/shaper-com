import { DomRegistry as DOM } from '../dom-registry.js';
import { TwoState } from '../shared/two-state.js';

function ctor(args = {}) {
    const self = this;
    
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    
    shadow.innerHTML = `
        <style>
            :host {
                display: flex;
                align-items: center;
                gap: 8px;
                height: 100%;
                width: 100%;
                // padding: 4px 8px;
                box-sizing: border-box;
                background: #f5f5f5;
                border-bottom: 1px solid #ccc;
            }
            .sections {
                display: flex;
                align-items: center;
                padding: 0 8px;
                gap: 8px;
                flex: 1;
            }
            .section {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .section-center {
                flex: 1;
                justify-content: center;
            }
            .section-right {
                justify-content: flex-end;
            }
            .section-label {
                font-size: 12px;
                color: #666;
                user-select: none;
            }
            .idle-slot {
                display: inline-flex;
                align-items: center;
            }
            .edit-slot {
                display: none;
                flex: 1;
                align-items: center;
            }
            :host(.editing) .sections {
                display: none;
            }
            :host(.editing) .edit-slot {
                display: flex;
            }
        </style>
        <div class="sections">
            <div class="section section-left"></div>
            <div class="section section-center"></div>
            <div class="section section-right"></div>
        </div>
        <div class="edit-slot">
            <slot name="edit-slot"></slot>
        </div>
`;
    
    const sectionsEl = shadow.querySelector('.sections');
    const leftSection = shadow.querySelector('.section-left');
    const centerSection = shadow.querySelector('.section-center');
    const rightSection = shadow.querySelector('.section-right');
    const editSlot = shadow.querySelector('.edit-slot');
    
    const toggles = new Map();
    let activeToggle = null;
    
    function getSection(position) {
        if (position === 'left') return leftSection;
        if (position === 'right') return rightSection;
        return centerSection;
    }
    
    return {
        getHost() { return host; },
        getInstance() { 
            return { 
                host,
                shadow,
                leftSection,
                centerSection,
                rightSection,
                editSlot,
                toggles,
                activeToggle: () => activeToggle,
                setActiveToggle: (t) => { activeToggle = t; },
                getSection,
                sectionsEl
            }; 
        }
    };
}

const ITwoStateBox = (instance) => ({
    add(name, position = 'center', idle, edit) {
        const toggle = TwoState({ idle, edit });
        
        instance.toggles.set(name, toggle);
        
        const wrapper = document.createElement('div');
        wrapper.className = 'idle-slot';
        
        const slot = document.createElement('slot');
        slot.name = `idle-${name}`;
        wrapper.appendChild(slot);
        
        const section = instance.getSection(position);
        section.appendChild(wrapper);
        
        DOM.attach(idle, this, { slot: slot.name });
        
        let currentEditCompound = null;
        
        idle.on('close', () => {
            toggle.showEdit();
        });
        
        toggle.on('edit', (data) => {
            instance.setActiveToggle(toggle);
            instance.host.classList.add('editing');
            
            if (currentEditCompound) {
                DOM.detach(currentEditCompound);
            }
            currentEditCompound = data.compound;
            DOM.attach(data.compound, this, { slot: 'edit-slot' });
            
            data.compound.once('close', () => {
                toggle.showIdle();
            });
        });
        
        toggle.on('idle', () => {
            instance.host.classList.remove('editing');
            
            if (currentEditCompound) {
                DOM.detach(currentEditCompound);
                currentEditCompound = null;
            }
            
            if (instance.activeToggle() === toggle) {
                instance.setActiveToggle(null);
            }
        });
        
        return this;
    },

    setIdle(name, compound) {
        const toggle = instance.toggles.get(name);
        if (toggle) {
            toggle.setIdleCompound(compound);
        }
        return this;
    },
    
    setEdit(name, compound) {
        const toggle = instance.toggles.get(name);
        if (toggle) {
            toggle.setEditCompound(compound);
        }
        return this;
    },
    
    closeActive() {
        const active = instance.activeToggle();
        if (active) {
            active.showIdle();
        }
        return this;
    }
});

const info = {
    clsid: 'jscom.dom-comps.two-state-box',
    name: 'TwoStateBox',
    description: 'Container for TwoState toggles with sections and a full-width edit slot',
    scheme: {
        leftLabel: 'string',
        centerLabel: 'string',
        rightLabel: 'string'
    }
};

DOM.register(ctor, (role) => {
    role('TwoStateBox', ITwoStateBox, true);
}, info);

export default info.clsid;