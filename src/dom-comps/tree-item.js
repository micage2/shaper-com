import { DomRegistry as DOM } from '../dom-registry.js';
import { loadFragment } from '../shared/dom-helper.js';

const html_file = "./src/dom-comps/tree-item.html";
const fragment = await loadFragment(html_file);

function ctor(args = {}) {
    const self = this;
    
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'closed' });
    
    const clone = fragment.cloneNode(true);
    shadow.appendChild(clone);
    
    const toggleBtn = shadow.querySelector('.toggle-btn');
    const iconSpan = shadow.querySelector('.icon');
    const labelSpan = shadow.querySelector('.label');
    const editInput = shadow.querySelector('.edit-input');
    
    iconSpan.textContent = args.icon || '';
    labelSpan.textContent = args.label || '';
    editInput.style.display = 'none';
    
    const itemType = args.type || 'leaf';
    const itemData = args.data || null;
    
    const folderIcons = {
        opened: '▽',
        closed: '▷',
        ...(args.folderIcons || {})
    };
    
    toggleBtn.addEventListener('click', () => {
        if (itemType === 'folder') {
            self.emit('toggle-clicked');
        }
    });
    
    const state = {
        depth: args.depth || 0,
        itemType: args.type || 'leaf',
        isExpanded: false,
        isSelected: false
    };
    
    function applyDepth() {
        toggleBtn.style.marginLeft = (state.depth * 16) + 'px';
    }
    
    function applyExpanded() {
        if (itemType === 'folder') {
            toggleBtn.textContent = state.isExpanded ? folderIcons.opened : folderIcons.closed;
        } else {
            toggleBtn.textContent = '•';
        }
    }
    
    function applySelected() {
        if (state.isSelected) {
            host.classList.add('selected');
        } else {
            host.classList.remove('selected');
        }
    }
    
    host.addEventListener('click', () => {
        self.emit('clicked');
    });
    
    labelSpan.addEventListener('dblclick', () => {
        editInput.value = labelSpan.textContent;
        labelSpan.style.display = 'none';
        editInput.style.display = 'inline-block';
        editInput.focus();
        editInput.select();
    });
    
    function commitEdit() {
        labelSpan.textContent = editInput.value;
        labelSpan.style.display = 'inline-block';
        editInput.style.display = 'none';
        self.emit('label-changed', editInput.value);
    }
    
    function cancelEdit() {
        labelSpan.style.display = 'inline-block';
        editInput.style.display = 'none';
    }
    
    editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            commitEdit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEdit();
        }
    });
    
    editInput.addEventListener('blur', commitEdit);
    
    applyDepth();
    applyExpanded();
    applySelected();
    
    return {
        getHost() { return host; },
        getInstance() { 
            return { 
                host,
                labelSpan,
                iconSpan,
                state,
                itemData,
                applyDepth,
                applyExpanded,
                applySelected
            }; 
        }
    };
}

const ITreeItem = (instance) => ({
    show() {
        instance.host.style.display = '';
        return this;
    },
    
    hide() {
        instance.host.style.display = 'none';
        return this;
    },
    
    isVisible() {
        return instance.host.style.display !== 'none';
    },
    
    getDepth() {
        return instance.state.depth;
    },
    
    setDepth(d) {
        instance.state.depth = d;
        instance.applyDepth();
        return this;
    },
    
    setExpanded(bool) {
        instance.state.isExpanded = bool;
        instance.applyExpanded();
        return this;
    },
    
    isExpanded() {
        return instance.state.isExpanded;
    },
    
    setSelected(bool) {
        instance.state.isSelected = bool;
        instance.applySelected();
        return this;
    },
    
    getLabel() {
        return instance.labelSpan.textContent;
    },
    
    setLabel(text) {
        instance.labelSpan.textContent = text;
        return this;
    },
    
    getIcon() {
        return instance.iconSpan.textContent;
    },
    
    setIcon(char) {
        instance.iconSpan.textContent = char;
        return this;
    },

    isFolder() {
        return instance.state.itemType === 'folder';
    },
    
    getData() {
        return instance.itemData;
    }
});

const info = {
    clsid: 'jscom.dom-comps.tree-item',
    name: 'TreeItem',
    description: 'Tree item with toggle, icon, label, and depth indentation',
    scheme: {
        label: 'string',
        icon: 'string',
        type: 'string',
        depth: 'number'
    }
};

DOM.register(ctor, (role) => {
    role('TreeItem', ITreeItem, true);
}, info);

export default info.clsid;