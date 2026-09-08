import { DomRegistry as DOM } from '../dom-registry.js';
import { loadFragment } from '../shared/dom-helper.js';
import CellView from './cell-view.js';

const html_file = "./src/dom-comps/grid-view.html";
const fragment = await loadFragment(html_file);

function ctor(args = {}) {
    const self = this;
    const model = args.model;
    const tableUuid = args.tableUuid;
    
    const table = model.getTable(tableUuid);
    if (!table) {
        console.error('[GridView] Table not found');
        return null;
    }
    
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'closed' });
    const clone = fragment.cloneNode(true);
    shadow.appendChild(clone);
    
    const grid = shadow.querySelector('.grid');
    const columnSlots = new Map();
    const rowCells = new Map();
    
    function createSimpleCell(text, cssClass = '') {
        const cell = document.createElement('div');
        cell.className = cssClass || 'cell-simple';
        cell.textContent = text;
        return cell;
    }
    
    function createDeleteCell(rowId) {
        const cell = createSimpleCell('×');
        cell.style.cursor = 'pointer';
        cell.style.justifyContent = 'center';
        cell.addEventListener('click', () => {
            table.deleteRow(rowId);
        });
        return cell;
    }

    function buildAll() {
        grid.innerHTML = '';
        columnSlots.clear();
        rowCells.clear();
        
        const deleteCol = document.createElement('div');
        deleteCol.className = 'column';
        deleteCol.style.minWidth = '24px';
        deleteCol.style.width = '24px';
        
        const deleteHeader = createSimpleCell('×', 'cell-header');
        deleteHeader.style.justifyContent = 'center';
        deleteCol.appendChild(deleteHeader);
        
        table.forRows((row) => {
            deleteCol.appendChild(createDeleteCell(row.id));
        });
        grid.appendChild(deleteCol);
        
        const indexCol = document.createElement('div');
        indexCol.className = 'column';
        indexCol.style.minWidth = '40px';
        indexCol.style.width = '40px';
        
        const indexHeader = createSimpleCell('#', 'cell-header');
        indexHeader.style.justifyContent = 'center';
        indexCol.appendChild(indexHeader);
        
        let idx = 0;
        table.forRows(() => {
            const cell = createSimpleCell(String(idx++));
            cell.style.justifyContent = 'center';
            indexCol.appendChild(cell);
        });
        grid.appendChild(indexCol);
        
        table.forColumns((col) => {
            const column = document.createElement('div');
            column.className = 'column';
            
            const header = createSimpleCell(col.name, 'cell-header');
            if (col.type === 2) header.style.justifyContent = 'flex-end';
            else if (col.type === 3) header.style.justifyContent = 'center';
            column.appendChild(header);
            
            const slot = document.createElement('slot');
            slot.name = `col-${col.colId}`;
            column.appendChild(slot);
            
            grid.appendChild(column);
            columnSlots.set(col.colId, { column, slot });
        });
    }
    
    function addCell(iface, rowId, col) {
        const cellView = DOM.create(CellView, {
            type: col.type,
            table: table,
            model: model,
            rowId: rowId,
            colId: col.colId,
            targetTableUuid: col.targetTableUuid || null
        });
        
        if (cellView) {
            const entry = columnSlots.get(col.colId);
            if (entry) {
                DOM.attach(cellView, iface, { slot: entry.slot.name });
                if (!rowCells.has(rowId)) rowCells.set(rowId, new Map());
                rowCells.get(rowId).set(col.colId, cellView);
            }
        }
    }
    
    function addAllCells(iface) {
        table.forColumns((col) => {
            table.forRows((row) => {
                addCell(iface, row.id, col);
            });
        });
    }
    
    table.on('row-added', (data) => {
        const rowId = data.rowId;
        
        const deleteCol = grid.children[0];
        if (deleteCol) {
            deleteCol.appendChild(createDeleteCell(rowId));
        }
        
        const indexCol = grid.children[1];
        if (indexCol) {
            indexCol.appendChild(createSimpleCell(String(indexCol.children.length - 1)));
        }
        
        table.forColumns((col) => {
            addCell(self, rowId, col);
        });
    });
    
    table.on('row-deleted', (data) => {
        const rowId = data.rowId;
        
        const cells = rowCells.get(rowId);
        if (cells) {
            for (const cellView of cells.values()) {
                DOM.detach(cellView);
            }
            rowCells.delete(rowId);
        }
        
        buildAll();
    });
    
    table.on('column-added', (data) => {
        const col = table.forColumns(c => c.colId === data.colId);
        if (!col) return;
        
        const column = document.createElement('div');
        column.className = 'column';
        column.appendChild(createSimpleCell(col.name, 'cell-header'));
        
        const slot = document.createElement('slot');
        slot.name = `col-${col.colId}`;
        column.appendChild(slot);
        
        grid.appendChild(column);
        columnSlots.set(col.colId, { column, slot });
        
        table.forRows((row) => {
            addCell(self, row.id, col);
        });
    });
    
    table.on('column-removed', (data) => {
        const entry = columnSlots.get(data.colId);
        if (entry) {
            entry.column.remove();
            columnSlots.delete(data.colId);
        }
        
        for (const cells of rowCells.values()) {
            cells.delete(data.colId);
        }
    });
    
    return {
        getHost() { return host; },
        getInstance() { 
            return { model, tableUuid, table }; 
        },
        postCreate() {
            buildAll();
            addAllCells(this);
        }
    };
}

const IGridView = (instance) => ({});

const info = {
    clsid: 'jscom.dom-comps.grid-view',
    name: 'GridView',
    description: 'Table editor with cell editing',
    scheme: {
        model: 'object',
        tableUuid: 'string'
    }
};

DOM.register(ctor, (role) => {
    role('GridView', IGridView, true);
}, info);

export default info.clsid;