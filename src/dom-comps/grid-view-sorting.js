import { DomRegistry as DOM } from '../dom-registry.js';
import { loadFragment } from '../shared/dom-helper.js';
import CellView from './cell-view.js';
import { getRowLabel } from '../shared/tree-utils.js';

const html_file = "./src/dom-comps/grid-view-sorting.html";
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
    
    const columns = new Map();
    const rowCells = new Map();
    
    let sortColumn = '__index__';
    let sortDirection = 'asc';
    
    function createSimpleCell(text, cssClass = '') {
        const cell = document.createElement('div');
        cell.className = cssClass || 'cell-simple';
        cell.textContent = text;
        return cell;
    }
    
    function addRow(rowId) {
        if (!rowCells.has(rowId)) rowCells.set(rowId, new Map());
    }
    
    function addCell(rowId, colKey, entry) {
        addRow(rowId);
        rowCells.get(rowId).set(colKey, entry);
    }
    
    function createDeleteCell(rowId) {
        const cell = createSimpleCell('×');
        cell.style.cursor = 'pointer';
        cell.style.justifyContent = 'center';
        cell.addEventListener('click', () => {
            model.deleteRow(tableUuid, rowId);
        });
        return cell;
    }
    
    function createIndexCell(index) {
        const cell = createSimpleCell(String(index));
        cell.style.justifyContent = 'center';
        return cell;
    }
    
    function createSortButton(colId) {
        const btn = document.createElement('button');
        btn.className = 'sort-btn';
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            cycleSort(colId);
        });
        return btn;
    }
    
    function buildDeleteColumn() {
        const column = document.createElement('div');
        column.className = 'column';
        column.style.minWidth = '32px';
        column.style.width = '32px';
        
        const header = createSimpleCell('×', 'cell-header');
        header.style.justifyContent = 'center';
        column.appendChild(header);
        
        table.forRows((row) => {
            const cell = createDeleteCell(row.id);
            column.appendChild(cell);
            addCell(row.id, '__delete__', { element: cell });
        });
        
        grid.appendChild(column);
        columns.set('__delete__', { column });
    }
    
    function buildIndexColumn() {
        const column = document.createElement('div');
        column.className = 'column';
        column.style.minWidth = '50px';
        column.style.width = '50px';
        
        const header = document.createElement('div');
        header.className = 'cell-header';
        header.style.justifyContent = 'center';
        
        const label = document.createElement('span');
        label.className = 'col-label';
        label.textContent = '#';
        label.style.textAlign = 'center';
        header.appendChild(label);
        
        const sortBtn = createSortButton('__index__');
        header.appendChild(sortBtn);
        
        column.appendChild(header);
        
        let index = 0;
        table.forRows((row) => {
            const cell = createIndexCell(index++);
            column.appendChild(cell);
            addCell(row.id, '__index__', { element: cell });
        });
        
        grid.appendChild(column);
        columns.set('__index__', { column, sortBtn });
    }
    
    function buildDataColumn(col) {
        const column = document.createElement('div');
        column.className = 'column';
        
        const header = document.createElement('div');
        header.className = 'cell-header';
        
        const label = document.createElement('span');
        label.className = 'col-label';
        label.textContent = col.name;
        if (col.type === 2) label.style.textAlign = 'right';
        else if (col.type === 3) label.style.textAlign = 'center';
        header.appendChild(label);
        
        const sortBtn = createSortButton(col.colId);
        header.appendChild(sortBtn);
        
        column.appendChild(header);
        
        const slot = document.createElement('slot');
        slot.name = `col-${col.colId}`;
        column.appendChild(slot);
        
        const resizer = document.createElement('div');
        resizer.className = 'resizer';
        resizer.addEventListener('mousedown', (e) => startResize(e, column));
        column.appendChild(resizer);
        
        grid.appendChild(column);
        columns.set(col.colId, { column, slot, col, sortBtn });
    }
    
    function startResize(e, column) {
        e.preventDefault();
        
        const startX = e.clientX;
        const startWidth = column.offsetWidth;
        
        function onMove(e) {
            const newWidth = Math.max(80, startWidth + e.clientX - startX);
            column.style.width = newWidth + 'px';
            column.style.minWidth = newWidth + 'px';
            column.style.maxWidth = newWidth + 'px';
        }
        
        function onUp() {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        }
        
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }
    
    function cycleSort(colId) {
        if (sortColumn === colId) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortColumn = colId;
            sortDirection = 'asc';
        }
        
        updateSortButtons();
        applySortOrder(self);
    }
    
    function updateSortButtons() {
        for (const [colId, entry] of columns) {
            if (!entry.sortBtn) continue;
            if (colId === sortColumn) {
                entry.sortBtn.classList.add('active');
                entry.sortBtn.textContent = sortDirection === 'asc' ? '▲' : '▼';
            } else {
                entry.sortBtn.classList.remove('active');
                entry.sortBtn.textContent = '↕';
            }
        }
    }
    
    function getSortedRowIds() {
        const rowIds = [];
        table.forRows((row) => { rowIds.push(row.id); });
        
        rowIds.sort((a, b) => {
            let valA, valB;
            
            if (sortColumn === '__index__') {
                valA = a;
                valB = b;
            } else {
                // valA = table.getCell(a, sortColumn);
                // valB = table.getCell(b, sortColumn);
                const column = table.forColumns(col => col.colId === sortColumn);
                valA = table.getCell(a, sortColumn);
                valB = table.getCell(b, sortColumn);
                
                if (column && column.type === 42) {
                    valA = getRowLabel(model, column.targetTableUuid, valA);
                    valB = getRowLabel(model, column.targetTableUuid, valB);
                }
        
            }
            
            if (valA === valB) return 0;
            const cmp = valA < valB ? -1 : 1;
            return sortDirection === 'asc' ? cmp : -cmp;
        });
        
        return rowIds;
    }
    
    function applySortOrder(iface) {
        const sortedRowIds = getSortedRowIds();
        console.log('sortedRowIds:', sortedRowIds);

        // Reorder delete column
        const deleteEntry = columns.get('__delete__');
        if (deleteEntry) {
            const cellElements = [];
            for (const rowId of sortedRowIds) {
                const rowEntry = rowCells.get(rowId);
                if (rowEntry && rowEntry.has('__delete__')) {
                    cellElements.push(rowEntry.get('__delete__').element);
                }
            }
            for (const cell of cellElements) cell.remove();
            for (const cell of cellElements) deleteEntry.column.appendChild(cell);
        }
        
        // Reorder index column
        const indexEntry = columns.get('__index__');
        if (indexEntry) {
            const cellElements = [];
            for (const rowId of sortedRowIds) {
                const rowEntry = rowCells.get(rowId);
                if (rowEntry && rowEntry.has('__index__')) {
                    cellElements.push(rowEntry.get('__index__').element);
                }
            }
            
            console.log('cellElements count:', cellElements.length);

            for (const cell of cellElements) cell.remove();
            for (const cell of cellElements) indexEntry.column.appendChild(cell);
        }
        
        // Reorder data columns
        table.forColumns((col) => {
            const entry = columns.get(col.colId);
            if (!entry || !entry.slot) return;
            
            const cellViewIfaces = [];
            for (const rowId of sortedRowIds) {
                const rowEntry = rowCells.get(rowId);
                if (rowEntry && rowEntry.has(col.colId)) {
                    cellViewIfaces.push(rowEntry.get(col.colId).iface);
                }
            }
            
            for (const cv of cellViewIfaces) DOM.detach(cv);
            for (const cv of cellViewIfaces) DOM.attach(cv, iface, { slot: entry.slot.name });
        });
    }
    
    function updateIndexColumn() {
        const entry = columns.get('__index__');
        if (!entry) return;
        
        let index = 0;
        table.forRows((row) => {
            const cells = rowCells.get(row.id);
            if (cells) {
                const indexEntry = cells.get('__index__');
                if (indexEntry && indexEntry.element) {
                    indexEntry.element.textContent = String(index);
                }
            }
            index++;
        });
    }
    
    function addCellsToColumn(iface, rowId, col) {
        const entry = columns.get(col.colId);
        if (!entry) return;
        
        const cellView = DOM.create(CellView, {
            type: col.type,
            table: table,
            model: model,
            rowId: rowId,
            colId: col.colId,
            targetTableUuid: col.targetTableUuid || null
        });
        
        if (cellView) {
            DOM.attach(cellView, iface, { slot: entry.slot.name });
            addCell(rowId, col.colId, { iface: cellView });
        }
    }
    
    function addAllDataCells(iface) {
        table.forColumns((col) => {
            table.forRows((row) => {
                addCellsToColumn(iface, row.id, col);
            });
        });
    }
    
    buildDeleteColumn();
    buildIndexColumn();
    table.forColumns((col) => buildDataColumn(col));
    
    updateSortButtons();
    
    table.on('row-added', (data) => {
        const rowId = data.rowId;
        
        const deleteEntry = columns.get('__delete__');
        if (deleteEntry) {
            const cell = createDeleteCell(rowId);
            deleteEntry.column.appendChild(cell);
            addCell(rowId, '__delete__', { element: cell });
        }
        
        const indexEntry = columns.get('__index__');
        if (indexEntry) {
            const cell = createIndexCell(0);
            indexEntry.column.appendChild(cell);
            addCell(rowId, '__index__', { element: cell });
            updateIndexColumn();
        }
        
        table.forColumns((col) => addCellsToColumn(self, rowId, col));
    });
    
    table.on('row-deleted', (data) => {
        const rowId = data.rowId;
        const cells = rowCells.get(rowId);
        if (!cells) return;
        
        for (const entry of cells.values()) {
            if (entry.element && entry.element.parentNode) {
                entry.element.remove();
            }
            if (entry.iface) {
                DOM.detach(entry.iface);
            }
        }
        rowCells.delete(rowId);
        
        updateIndexColumn();
    });
    
    table.on('column-added', (data) => {
        const col = table.forColumns(c => c.colId === data.colId);
        if (!col) return;
        
        buildDataColumn(col);
        
        table.forRows((row) => addCellsToColumn(self, row.id, col));
    });
    
    table.on('column-removed', (data) => {
        const entry = columns.get(data.colId);
        if (entry) {
            entry.column.remove();
            columns.delete(data.colId);
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
            addAllDataCells(this);
        }
    };
}

const IGridView = (instance) => ({});

const info = {
    clsid: 'jscom.dom-comps.grid-view-sorting',
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