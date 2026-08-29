import { DomRegistry as DOM } from '../dom-registry.js';

function ctor(args = {}) {
    const self = this;
    
    const host = document.createElement('div');
    host.className = 'list-view';
    host.style.cssText = 'display:block !important; overflow-y:auto !important; overflow-x:hidden !important; width:100% !important; height:100% !important;';    
    const itemClsid = args.itemClsid;
    
    const state = {
        items: [],
        selectedItem: null
    };
    
    function selectItem(item, silent = false) {
        if (item === null) {
            if (state.selectedItem) {
                state.selectedItem.setSelected(false);
            }
            state.selectedItem = null;
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
                selectItem
            }; 
        }
    };
}

const IListView = (instance) => ({
    add(itemData) {
        itemData.depth = 0;
        const item = DOM.create(instance.itemClsid, itemData);
        
        item.on('clicked', () => {
            instance.selectItem(item);
        });
        
        item.on('label-changed', (newLabel) => {
            this.emit('item-label-changed', { item, newLabel });
        });
        
        instance.state.items.push(item);
        DOM.attach(item, this);
        
        this.emit('item-added', item);
        
        return item;
    },
    
    remove(item) {
        const idx = instance.state.items.indexOf(item);
        if (idx === -1) return this;
        
        DOM.detach(item);
        instance.state.items.splice(idx, 1);
        
        if (instance.state.selectedItem === item) {
            instance.state.selectedItem = null;
        }
        
        this.emit('item-deleted', item);
        
        return this;
    },
    
    select(item, silent = false) {
        instance.selectItem(item, silent);
    },
    
    getSelected() {
        return instance.state.selectedItem;
    }
});

const info = {
    clsid: 'jscom.dom-comps.list-view',
    name: 'ListView',
    description: 'Flat list of selectable items',
    scheme: {
        // itemClsid: 'string'
        itemClsid: { type: 'string', validator: (value) => value.startsWith('jscom.dom-comps.')}
    }
};

// idea: itemClsid: { type: 'string', validator: (value) => value.startsWith('jscom.dom-comps.')}
// idea: height: { type: 'number', validator: (value) => value >= 0 }

DOM.register(ctor, (role) => {
    role('ListView', IListView, true);
}, info);

export default info.clsid;