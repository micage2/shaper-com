import { Mediator } from './mediator.js';

export function TwoState(args = {}) {
    let idleCompound = args.idle || null;
    let editCompound = args.edit || null;
    let isEditing = false;
    
    const hub = new Mediator();
    
    return {
        showEdit() {
            if (isEditing) return;
            isEditing = true;
            hub.emit('edit', { compound: editCompound });
        },
        
        showIdle() {
            if (!isEditing) return;
            isEditing = false;
            hub.emit('idle', { compound: idleCompound });
        },
        
        isEditing() {
            return isEditing;
        },
        
        setIdleCompound(compound) {
            idleCompound = compound;
        },
        
        setEditCompound(compound) {
            editCompound = compound;
        },
        
        on(event, cb) {
            return hub.on(event, cb);
        },
        
        off(event, cb) {
            hub.off(event, cb);
        }
    };
}