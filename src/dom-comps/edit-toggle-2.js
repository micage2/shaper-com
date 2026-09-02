// src/dom-comps/edit-toggle.js
import { DomRegistry as DOM } from '../dom-registry.js';

function ctor(args = {}) {
    const self = this;
    
    const host = document.createElement('div');
    host.style.cssText = 'display:inline-flex;align-items:center;gap:4px;';
    const shadow = host.attachShadow({ mode: 'closed' });
    
    const idleSlot = document.createElement('slot');
    idleSlot.name = 'idle';
    idleSlot.style.cssText = 'display:flex;align-items:center;gap:4px;';
    shadow.appendChild(idleSlot);
    
    const editSlot = document.createElement('slot');
    editSlot.name = 'edit';
    editSlot.style.cssText = 'display:none;align-items:center;gap:4px;';
    shadow.appendChild(editSlot);
    
    let idleCompound = args.idleCompound || null;
    let editCompound = args.editCompound || null;
    
    function showIdle() {
        idleSlot.style.display = 'flex';
        editSlot.style.display = 'none';
        self.emit('idle', { toggle: self });
    }
    
    function showEdit() {
        idleSlot.style.display = 'none';
        editSlot.style.display = 'flex';
        self.emit('edit', { toggle: self });
    }
    
    return {
        getHost() { return host; },
        getInstance() { 
            return { 
                self, 
                idleCompound, 
                editCompound,
                showIdle,
                showEdit
            }; 
        },
        postCreate(instance) {
            if (instance.idleCompound) {
                DOM.attach(instance.idleCompound, instance.self, { slot: 'idle' });
                instance.idleCompound.on('close', instance.showEdit);
            }
            
            if (instance.editCompound) {
                DOM.attach(instance.editCompound, instance.self, { slot: 'edit' });
                instance.editCompound.on('close', instance.showIdle);
            }
        }
    };
}

const IEditToggle = (instance) => ({
    setIdleCompound(compound) {
        if (instance.idleCompound) {
            DOM.detach(instance.idleCompound);
            instance.idleCompound.on('close', instance.showEdit);
        }
        DOM.attach(compound, instance.self, { slot: 'idle' });
        compound.on('close', instance.showEdit);
        instance.idleCompound = compound;
        return this;
    },
    
    setEditCompound(compound) {
        if (instance.editCompound) {
            DOM.detach(instance.editCompound);
            instance.editCompound.on('close', instance.showIdle);
        }
        DOM.attach(compound, instance.self, { slot: 'edit' });
        compound.on('close', instance.showIdle);
        instance.editCompound = compound;
        return this;
    }
});

const info = {
    clsid: 'jscom.dom-comps.edit-toggle-2',
    name: 'EditToggle',
    description: 'Toggles between idle and edit compounds',
    scheme: {
        idleCompound: {
            as: 'function', 
            on: 'function',
            uid: 'string'
        },
        editCompound: {
            as: 'function', 
            on: 'function',
            uid: 'string'
        }
    }
};

DOM.register(ctor, (role) => {
    role('EditToggle', IEditToggle, true);
}, info);

export default info.clsid;