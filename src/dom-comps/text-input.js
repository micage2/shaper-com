// src/dom-comps/text-input.js
import { DomRegistry as DOM } from '../dom-registry.js';

function ctor(args = {}) {
    const self = this;
    
    const host = document.createElement('input');
    host.type = 'text';
    host.placeholder = args.placeholder || '';
    host.value = args.value || '';
    host.style.cssText = 'height: var(--control-height, 28px); padding: var(--control-padding, 4px 12px); border: var(--control-border, 1px solid #ccc); border-radius: var(--control-radius, 4px); font-size: var(--control-font-size, 12px); font-family: Segoe UI, Arial, sans-serif;';
    
    host.addEventListener('change', () => {
        self.emit('change', { value: host.value });
    });
    
    host.addEventListener('blur', () => {
        self.emit('change', { value: host.value });
    });
    
    host.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            host.blur();
            self.emit('change', { value: host.value });
        }
        if (e.key === 'Escape') {
            host.blur();
        }
    });
    
    return {
        getHost() { return host; },
        getInstance() { return host; }
    };
}

const ITextInput = (host) => ({
    getValue() {
        return host.value;
    },
    
    setValue(value) {
        host.value = value;
        return this;
    },
    
    focus() {
        host.focus();
        return this;
    },
    
    select() {
        host.select();
        return this;
    }
});

const info = {
    clsid: 'jscom.dom-comps.text-input',
    name: 'TextInput',
    description: 'Simple text input field',
    scheme: {
        placeholder: 'string',
        value: 'string'
    }
};

DOM.register(ctor, (role) => {
    role('TextInput', ITextInput, true);
}, info);

export default info.clsid;