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
    
    remove(item) {
        const idx = instance.state.items.indexOf(item);
        if (idx === -1) return this;
        
        const endIdx = instance.getSubtreeEndIndex(idx);
        
        for (let i = endIdx; i >= idx; i--) {
            const it = instance.state.items[i];
            DOM.detach(it);
            instance.state.items.splice(i, 1);
        }
        
        if (instance.state.selectedItem === item) {
            instance.state.selectedItem = null;
        }
        
        this.emit('item-deleted', item);
        
        return this;
    },

    getSelected() {
        return instance.state.selectedItem;
    },

    select(item, silent = false) {
        instance.selectItem(item, silent);
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