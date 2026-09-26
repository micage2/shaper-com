import { DomRegistry as DOM } from '../dom-registry.js';
import SimpleView from '../dom-comps/simple-view.js';

export default function GridEditor(iface) {
    const view = DOM.create(SimpleView, { title: 'Grid' });
    
    iface.on('table-selected', (data) => {
        console.log('[GridEditor] table-selected:', data.tableUuid);
    });
    
    return view;
}
