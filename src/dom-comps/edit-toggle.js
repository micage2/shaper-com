import { DomRegistry as DOM } from '../dom-registry.js';
import { loadFragment } from '../shared/dom-helper.js';

const html_file = "./src/dom-comps/edit-toggle.html";
const fragment = await loadFragment(html_file);

function ctor(args = {}) {
    const self = this;
    
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'closed' });
    
    const clone = fragment.cloneNode(true);
    shadow.appendChild(clone);
    
    const idleContainer = shadow.querySelector('.idle-container');
    const editContainer = shadow.querySelector('.edit-container');
    const editArea = shadow.querySelector('.edit-area');
    
    const onfinish = args.onfinish || (() => {});
    
    const idleButton = document.createElement('button');
    idleButton.className = 'idle-button';
    idleButton.textContent = args.idleLabel || 'Edit';
    if (args.idleClass) {
        idleButton.classList.add(args.idleClass);
    }
    idleContainer.appendChild(idleButton);
    
    const inputs = new Map();
    const configByName = new Map();
    
    function populateSelect(select, child) {
        select.innerHTML = '';
        
        const options = typeof child.options === 'function'
            ? child.options()
            : child.options;
        
        for (const option of options || []) {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.label;
            select.appendChild(opt);
        }
        
        if (child.selected) {
            select.value = child.selected;
        }
    }
    
    for (const child of args.editChildren || []) {
        if (child.type === 'button') {
            const button = document.createElement('button');
            button.className = 'edit-button';
            button.textContent = child.label || '';
            button.addEventListener('click', () => {
                if (child.action === 'ok') {
                    onfinish(true, collectValues());
                } else if (child.action === 'cancel') {
                    onfinish(false, null);
                }
                showIdle();
            });
            editArea.appendChild(button);
        } else if (child.type === 'input') {
            const input = document.createElement('input');
            input.className = 'edit-input';
            input.name = child.name || '';
            input.placeholder = child.placeholder || '';
            input.value = child.value || '';
            editArea.appendChild(input);
            inputs.set(input.name, input);
            configByName.set(input.name, child);
        } else if (child.type === 'select') {
            const select = document.createElement('select');
            select.className = 'edit-select';
            select.name = child.name || '';
            
            populateSelect(select, child);
            
            editArea.appendChild(select);
            inputs.set(select.name, select);
            configByName.set(select.name, child);
        }
    }
    
    function collectValues() {
        const values = {};
        for (const [name, input] of inputs) {
            values[name] = input.value;
        }
        return values;
    }
    
    function updateVisibility() {
        for (const [name, input] of inputs) {
            const child = configByName.get(name);
            if (child && child.visibleWhen) {
                const { field, value } = child.visibleWhen;
                const sourceInput = inputs.get(field);
                if (sourceInput) {
                    if (sourceInput.value === value) {
                        input.style.display = '';
                    } else {
                        input.style.display = 'none';
                    }
                }
            }
        }
    }
    
    for (const input of inputs.values()) {
        input.addEventListener('change', updateVisibility);
    }
    
    function showEdit() {
        for (const [name, input] of inputs) {
            if (input.tagName === 'SELECT') {
                const child = configByName.get(name);
                if (child && typeof child.options === 'function') {
                    populateSelect(input, child);
                }
            }
        }
        
        idleContainer.style.display = 'none';
        editContainer.style.display = 'block';
        updateVisibility();
        self.emit('edit-toggle.edit');
    }
    
    function showIdle() {
        idleContainer.style.display = 'block';
        editContainer.style.display = 'none';
        self.emit('edit-toggle.idle');
    }
    
    idleButton.addEventListener('click', showEdit);
    
    idleContainer.style.display = 'block';
    editContainer.style.display = 'none';
    
    return {
        getHost() { return host; },
        getInstance() { return { idleContainer, editContainer } }
    };
}

const IEditToggle = (instance) => ({});

const info = {
    clsid: 'jscom.dom-comps.edit-toggle',
    name: 'EditToggle',
    description: 'Button that toggles to inline edit form'
};

DOM.register(ctor, (role) => {
    role('EditToggle', IEditToggle, true);
}, info);

export default info.clsid;