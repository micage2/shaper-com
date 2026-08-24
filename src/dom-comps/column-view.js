import { DomRegistry as DOM } from '../dom-registry.js';
import CellView from './cell-view.js';

function ctor(args = {}) {
    const host = document.createElement('div');
    host.className = 'column-view';
    
    return {
        getHost() { return host; },
        getInstance() { return { host }; }
    };
}

const IColumnView = (instance) => ({
    addCell(cellData) {
        const cellView = DOM.create(CellView, cellData);
        DOM.attach(cellView, this);
        return this;
    },
    
    setWidth(width) {
        instance.host.style.width = width + 'px';
        instance.host.style.flexShrink = '0';
        return this;
    }
});

const info = {
    clsid: 'jscom.dom-comps.column-view',
    name: 'ColumnView',
    description: 'Vertical column of cells'
};

DOM.register(ctor, (role) => {
    role('ColumnView', IColumnView, true);
}, info);

export default info.clsid;