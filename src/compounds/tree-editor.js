import { DomRegistry as DOM } from '../dom-registry.js';
import LR from '../dom-comps/left-right.js';
import PropertyView from '../dom-comps/property-view.js';

export default function TreeEditor(iface) {
    const layout = DOM.create(LR, {});
    const propView = DOM.create(PropertyView, { caption: 'No Selection' });
    
    layout.setRight(propView);
    
    let currentTreeView = null;
    let currentTableUuid = null;
    
    iface.on('table-changed', (data) => {
        currentTableUuid = data.tableUuid;
        currentTreeView = iface.buildTree(data.tableUuid);
        layout.setLeft(currentTreeView);
    });
    
    iface.on('row-added', (data) => {
        if (!currentTreeView) return;
        if (data.tableUuid !== currentTableUuid) return;
        
        currentTreeView.add({
            label: data.label,
            icon: data.icon,
            type: 'folder',
            data: { tableUuid: data.tableUuid, rowId: data.rowId }
        });
    });
    
    return layout;
}