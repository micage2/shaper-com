import { DomRegistry as DOM } from '../dom-registry.js';

function ctor(args = {}) {
    const self = this;
    
    const host = document.createElement('div');
    host.style.cssText = 'display:inline-flex;align-items:center;gap:4px;';
    const shadow = host.attachShadow({ mode: 'closed' });
    
    const idleButton = document.createElement('button');
    idleButton.style.cssText = 'height: var(--control-height, 28px); padding: var(--control-padding, 4px 12px); border: var(--control-border, 1px solid #ccc); border-radius: var(--control-radius, 4px); font-size: var(--control-font-size, 12px); background:#fff; cursor:pointer; white-space:nowrap; font-family: Segoe UI, Arial, sans-serif;';
    idleButton.textContent = args.idleLabel || 'Edit';
    shadow.appendChild(idleButton);
    
    const editSlot = document.createElement('slot');
    editSlot.name = 'edit';
    editSlot.style.cssText = 'display:none;align-items:center;gap:4px;';
    editSlot.style.display = 'none';
    shadow.appendChild(editSlot);
    
    idleButton.addEventListener('click', () => showEdit() );
    if (args.editCompound) args.editCompound.on('close', showIdle);
    
    function showEdit() {
        idleButton.style.display = 'none';
        editSlot.style.display = 'flex';
        self.emit('edit', { toggle: self });
    }
    
    function showIdle() {
        idleButton.style.display = '';
        editSlot.style.display = 'none';
        self.emit('idle', { toggle: self });
    }    
    
    return {
        getHost() { return host; },
        getInstance() { return { self, editCompound: args.editCompound }; },
        postCreate({self, editCompound}) {
            if (editCompound)
                DOM.attach(editCompound, self, { slot: 'edit' });
        }
    };
}

const IEditToggle = (instance) => ({});

const info = {
    clsid: 'jscom.dom-comps.edit-toggle',
    name: 'EditToggle',
    description: 'Button that toggles edit mode with a slot for custom edit UI',
    scheme: {
        idleLabel: 'string',
        editCompound: {
            as: 'function', 
            on: 'function',
            uid: 'string',
            ppp: { type: 'number', required: false } // a test
        }
    }
};

DOM.register(ctor, (role) => {
    role('EditToggle', IEditToggle, true);
}, info);

export default info.clsid;