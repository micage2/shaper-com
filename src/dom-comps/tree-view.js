import { DomRegistry as DOM } from '../dom-registry.js';

function ctor(args = {}) {
    const self = this;
    
    const host = document.createElement('div');
    host.className = 'tree-view';
    host.style.cssText = 'display:block !important; overflow-y:auto !important; overflow-x:hidden !important; width:100% !important; height:100% !important;';    
    
    const itemClsid = args.itemClsid;
    
    const state = {
        items: [],
        selectedItem: null
    };
    
    function getSubtreeEndIndex(index) {
        const item = state.items[index];
        if (!item) return index;
        const depth = item.getDepth();
        let end = index;
        for (let i = index + 1; i < state.items.length; i++) {
            if (state.items[i].getDepth() > depth) {
                end = i;
            } else {
                break;
            }
        }
        return end;
    }
    
    function toggleItem(item) {
        let i = state.items.indexOf(item);
        if (i === -1) return;
        
        const end = getSubtreeEndIndex(i);
        
        item.setExpanded(!item.isExpanded());
        
        while (i < end) {
            i++;
            const descendant = state.items[i];
            
            if (descendant.isVisible()) {
                descendant.hide();
            } else {
                descendant.show();
            }
            
            if (!descendant.isExpanded()) {
                i = getSubtreeEndIndex(i);
                continue;
            }
        }
    }
    
    function selectItem(item, silent = false) {
        if (item === null) {
            if (state.selectedItem) {
                state.selectedItem.setSelected(false);
            }
            state.selectedItem = null;
            if (!silent) 
                self.emit('item-selected', null);
            return;
        }
        
        if (state.selectedItem === item) return;
        
        if (state.selectedItem) {
            state.selectedItem.setSelected(false);
        }
        
        state.selectedItem = item;
        state.selectedItem.setSelected(true);
        
        if (!silent) {
            self.emit('item-selected', item);
        }
    }    
    
    return {
        getHost() { return host; },
        getInstance() { 
            return { 
                itemClsid,
                state,
                getSubtreeEndIndex,
                toggleItem,
                selectItem
            }; 
        }
    };
}

const ITreeView = (instance) => ({
    find(predicate) {
        return instance.state.items.find(predicate);
    },

    forEach(callback) {
        for (const item of instance.state.items) {
            callback(item, item.getData());
        }
    },

    // if callback is not returning a truthy value the whole item array will be iterated
    // combines the two functions above
    forItems(callback) {
        for (const item of instance.state.items) {
            if (callback(item)) return item;
        }
        return null;
    },

    add(itemData) {
        const selected = this.getSelected();
        if (selected && !selected.isFolder()) {
            console.log("No folder", itemData);            
            return;
        };
        
        let item = null;
        if (selected) {
            itemData.depth = selected.getDepth() + 1
            item = DOM.create(instance.itemClsid, itemData);

            const selectedIdx = instance.state.items.indexOf(selected);
            const endIdx = instance.getSubtreeEndIndex(selectedIdx);
            instance.state.items.splice(endIdx + 1, 0, item);
            selected.setExpanded(true);
            
            const insertAfter = instance.state.items[endIdx];
            if (insertAfter) {
                DOM.attach(item, insertAfter, { mode: 'after' });
            } else {
                DOM.attach(item, this);
            }
        }
        else {
            itemData.depth = 0;
            item = DOM.create(instance.itemClsid, itemData);
            instance.state.items.push(item);
            DOM.attach(item, this);
        }

        item.on('toggle-clicked', () => {
            instance.toggleItem(item);
        });
        
        item.on('clicked', () => {
            instance.selectItem(item);
        });
        
        item.on('label-changed', (newLabel) => {
            this.emit('item-label-changed', { item, newLabel });
        });
        
        if (itemData.autoSelect) {
            instance.selectItem(item, true);
        }

        this.emit('item-added', item);

        // console.log("--".repeat(item.getDepth()), itemData.label);
        
        return item;
    },

    move(item, newParent) {
        const idx = instance.state.items.indexOf(item);
        if (idx === -1) return this;
        
        const endIdx = instance.getSubtreeEndIndex(idx);
        const blockSize = endIdx - idx + 1;
        
        // Calculate target index
        let targetIdx;
        if (newParent) {
            const parentIdx = instance.state.items.indexOf(newParent);
            if (parentIdx === -1) return this;
            
            // Cycle check: is newParent inside the moving block?
            if (parentIdx >= idx && parentIdx <= endIdx) return this;
            
            targetIdx = instance.getSubtreeEndIndex(parentIdx) + 1;
        } else {
            targetIdx = 0;
        }
        
        // Cycle check: is target inside the moving block?
        if (targetIdx > idx && targetIdx <= endIdx + 1) return this;
        
        // Adjust target if after the block (since block will be removed)
        if (targetIdx > endIdx) {
            targetIdx -= blockSize;
        }
        
        // Remove block from array
        const block = instance.state.items.splice(idx, blockSize);
        
        // Adjust depth
        const depthDelta = newParent ? newParent.getDepth() + 1 - block[0].getDepth() : -block[0].getDepth();
        block.forEach(it => it.setDepth(it.getDepth() + depthDelta));
        
        // Detach block from DOM
        block.forEach(it => DOM.detach(it));
        
        // Insert block into array at target
        instance.state.items.splice(targetIdx, 0, ...block);
        
        // Re-attach block to DOM - chain attachments
        let target = null;
        if (targetIdx > 0) {
            target = instance.state.items[targetIdx - 1];
        }
        
        for (const it of block) {
            if (target) {
                DOM.attach(it, target, { mode: 'after' });
            } else {
                // Insert at beginning
                if (targetIdx === 0 && instance.state.items.length > block.length) {
                    const firstAfter = instance.state.items[block.length];
                    DOM.attach(it, firstAfter, { mode: 'before' });
                    target = firstAfter;
                } else {
                    DOM.attach(it, this);
                }
            }
            target = it;
        }
        
        // Expand new parent
        if (newParent) {
            newParent.setExpanded(true);
        }
        
        return this;
    },    
    
    remove(item) {
        const idx = instance.state.items.indexOf(item);
        if (idx === -1) return this;
        
        const endIdx = instance.getSubtreeEndIndex(idx);
        
        for (let i = endIdx; i >= idx; i--) {
            const it = instance.state.items[i];
            DOM.detach(it);
            instance.state.items.splice(i, 1);
            
            this.emit('item-deleted', it);
        }
        
        if (instance.state.selectedItem === item) {
            instance.state.selectedItem = null;
        }
        
        return this;
    },

    getSelected() {
        return instance.state.selectedItem;
    },

    select(item, silent = false) {
        instance.selectItem(item, silent);
    },

    getParent(item) {
        const idx = instance.state.items.indexOf(item);
        if (idx === -1) return null;
        const depth = item.getDepth();
        for (let i = idx - 1; i >= 0; i--) {
            if (instance.state.items[i].getDepth() < depth) {
                return instance.state.items[i];
            }
        }
        return null;
    },
    
    getChildren(item) {
        const idx = instance.state.items.indexOf(item);
        if (idx === -1) return [];
        const endIdx = instance.getSubtreeEndIndex(idx);
        const children = [];
        const depth = item.getDepth();
        for (let i = idx + 1; i <= endIdx; i++) {
            if (instance.state.items[i].getDepth() === depth + 1) {
                children.push(instance.state.items[i]);
            }
        }
        return children;
    },
    
    getSiblings(item) {
        const parent = this.getParent(item);
        if (!parent) {
            // Root level siblings
            return instance.state.items.filter(it => it.getDepth() === 0);
        }
        return this.getChildren(parent);
    }
});

const info = {
    clsid: 'jscom.dom-comps.tree-view',
    name: 'TreeView',
    description: 'Flat list of tree items with folding and selection',
    scheme: {
        itemClsid: 'string'
    }
};

DOM.register(ctor, (role) => {
    role('TreeView', ITreeView, true);
}, info);

export default info.clsid;