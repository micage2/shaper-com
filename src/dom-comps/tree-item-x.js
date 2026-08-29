import { DomRegistry as DOM } from '../dom-registry.js';
import TreeItem from './tree-item.js';

function ctor(args = {}) {
    const self = this;
    
    const host = document.createElement('div');
    host.style.cssText = 'position:relative !important; width:100% !important; height:24px !important; box-sizing:border-box !important;';
    
    const treeItem = DOM.create(TreeItem, args);
    treeItem.on('clicked', () => {
        self.emit('clicked');
    });
    
    treeItem.on('toggle-clicked', () => {
        self.emit('toggle-clicked');
    });
    
    treeItem.on('label-changed', (newLabel) => {
        self.emit('label-changed', newLabel);
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '×';
    deleteBtn.style.cssText = 'position:absolute; right:4px; top:50%; transform:translateY(-50%); border:none; background:transparent; cursor:pointer; font-size:14px; color:#999; padding:0;';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        self.emit('delete-clicked');
    });
    host.appendChild(deleteBtn);
    
    return {
        getHost() { return host; },
        getInstance() { return { treeItem, host, deleteBtn }; },
        postCreate(instance) {
            DOM.attach(treeItem, this);
        }
    };
}

const ITreeItemX = (instance) => ({
    show() {
        instance.host.style.display = '';
        return instance.treeItem.show();
    },
    hide() {
        instance.host.style.display = 'none';
        return instance.treeItem.hide();
    },
    isVisible() { return instance.treeItem.isVisible(); },
    getDepth() { return instance.treeItem.getDepth(); },
    setDepth(d) { return instance.treeItem.setDepth(d); },
    setExpanded(b) { return instance.treeItem.setExpanded(b); },
    isExpanded() { return instance.treeItem.isExpanded(); },
    isFolder() { return instance.treeItem.isFolder(); },
    setSelected(b) { return instance.treeItem.setSelected(b); },
    getLabel() { return instance.treeItem.getLabel(); },
    setLabel(t) { return instance.treeItem.setLabel(t); },
    getIcon() { return instance.treeItem.getIcon(); },
    setIcon(c) { return instance.treeItem.setIcon(c); },
    getData() { return instance.treeItem.getData(); }
});

const info = {
    clsid: 'jscom.dom-comps.tree-item-x',
    name: 'TreeItemX',
    description: 'TreeItem with delete button'
};

DOM.register(ctor, (role) => {
    role('TreeItemX', ITreeItemX, true);
}, info);

export default info.clsid;