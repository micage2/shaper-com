import { Mediator } from './mediator.js';

export function Store(initial = {}) {
    const data = new Map(Object.entries(initial));
    const hub = new Mediator();
    
    function get(key) {
        return data.get(key);
    }
    
    function set(key, value) {
        const oldValue = data.get(key);
        if (oldValue === value) return;
        
        data.set(key, value);
        hub.emit('change', { key, value, oldValue });
    }
    
    function remove(key) {
        if (!data.has(key)) return;
        
        const oldValue = data.get(key);
        data.delete(key);
        hub.emit('change', { key, value: undefined, oldValue });
    }
    
    function has(key) {
        return data.has(key);
    }
    
    function on(event, handler) {
        return hub.on(event, handler);
    }
    
    function off(event, handler) {
        hub.off(event, handler);
    }
    
    function emit(event, payload) {
        hub.emit(event, payload);
    }
    
    return { get, set, remove, has, on, off, emit };
}