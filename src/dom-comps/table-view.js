import { DomRegistry as DOM } from '../dom-registry.js';
import { loadFragment } from '../shared/dom-helper.js';

// mothers little helper
const Div = () => document.createElement('div');

const Span = (text) => {
    const span = document.createElement('span');
    if (text) span.textContent = text;
    return span;
}

const Input = (type) => {
    const input = document.createElement('input'); 
    input.type = type;
    return input;
}

const Button = (text) => {
    const b = document.createElement('button');
    if (text) b.textContent = text;
    return b;
}

const Select = (self, cell) => {
    const {value, link} = cell;
    const selectEl = document.createElement('select');
    const rows = self.iTable.getRowNames(link);
    rows.map(row => {
        const data = row.data;
        const rowId = row.id;
        const label = Object.values(data)[0];

        const opt = document.createElement('option');
        opt.value = rowId;
        opt.textContent = label;
        selectEl.appendChild(opt);
    });
    selectEl.value = String(value);
    selectEl.addEventListener('change', (ev) => {
        console.log('cell changed', ev.target);
        // @ts-ignore
        const col = self.columns.get(ev.target.parentElement.parentElement);
        // @ts-ignore
        const cell = col.cells.get(ev.target.parentElement);
        // @ts-ignore
        self.iTable.setCell(col.id, cell.rowId, +ev.target.value);
    });

    return selectEl;
};

function resizeColumn(ev, column) {
    ev.preventDefault();

    const ruler = ev.target;

    const shield = Div();
    shield.style.cssText = `
        position: fixed; inset: 0; z-index: 9999;
        background: transparent; cursor: col-resize;
    `;
    document.body.appendChild(shield);
      
    const startX = ev.clientX;
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
        shield.remove();
        ruler.classList.remove('dragging');
    }
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
}


// TableView Concept:
    // - is a collection of cells arranged in matrix form m columns ⊗ n rows. 
    // - columns are horizontally stacked.
    // - each column is a collection of m vertically stacked cells.
    // - each column's first cell is a header cell (type: 111, class: 'col-header').
    // - first 3 columns are fixed and not editable or deletable, exception name cells
    //   1. 'x': each cell contains a delete button
    //   2. '#': each cell displays a running index
    //   3. 'name': cells display row.name, header cell is not editable, other cells are

    // Editable cells are two state elements, either in idle or edit mode.
    // In idle mode it's a label displaying a value. Exception: select and checkbox.
    // In edit mode it changes to an input control depending on datatype.
    // idle -> edit mode switch is by double clicking onto it.
    // edit -> idle is by either blur or pressing escape or enter key.
//

const html_file = "./src/dom-comps/table-view.html";
const fragment = await loadFragment(html_file);

function ctor({hub: iTable, options = {}}) {
    const that = this;

    const host = Div();
    const shadow = host.attachShadow({ mode: 'closed' });
    const clone = fragment.cloneNode(true);
    shadow.appendChild(clone);

    const table = shadow.querySelector('.table');

    const columns = new Map(); // colElem -> {col, rows}, rows = Map: cellElem -> { colId, rowId }

    // @ts-ignore
    window.cols = columns; // DEBUG

    let rowCount = 1;

    function findTableCoords(cell) {
        const colElem = cell.parentElement;
        const rowIndex = Array.from(colElem.children).indexOf(cell);
        const colIndex = Array.from(table.children).indexOf(colElem);
        return { rowIndex, colIndex };
    }    
    
    const self = {
        iTable,
        columns,
    };

    that.on('unmounted', () => console.log('[TableView] unmounted', that.uid));

    // init fixed columns
    const initCols = [
        { name: '❌', type: 1000 },
        { name: '#', type: 999 },
    ];
    for (const col of initCols) {
        const colElem = Column(col);
        table.appendChild(colElem);
    }
    const dummyCol = { name: '', type: 998 };
    const dummyColElem = Column(dummyCol);
    table.appendChild(dummyColElem);

    /**
     * @param {Object} col
     * @property {number} col.type
     * @property {string} col.id
     * @property {string} col.name
     */
    function Column(col) {
        const colElem = Div();
        colElem.className = 'column';

        if (col.type === 1000) colElem.classList.add('x');
        if (col.type === 999) colElem.classList.add('index');
        if (col.type === 998) colElem.classList.add('dummy');

        const header = Cell({ col: {...col, type: 111}, cell: { value: col.name } });
        header.className = 'cell col-header';
        colElem.appendChild(header);

        const cells = new Map();
        columns.set(colElem, { ...col, cells });
        const [col0] = columns.values();

        // add cells for existing rows
        // for (let n = 0; n < rowCount - 1; n++) {
        for (const cell0 of col0.cells.values()) {
            const cell = { type: col.type, rowId: cell0.rowId,  };
            const cellElem = Cell({ col, cell });
            colElem.appendChild(cellElem);
            cells.set(cellElem, cell);
        }

        return colElem;
    }

    /**
     * @param {Object} data
     * @property {Object} data.col
     * @property {Object} data.cell
     */
    function Cell({ col, cell }) {
        const cellElem = Div();
        cellElem.className = 'cell';

        let content = Span(cell.value);
        let input = null;

        if (col.type === 1000) {
            content = Button('🗑');
            content.onclick = (ev) => {
                iTable.confirmDeleteRow(cell.rowId);
            };
        }
        else if (col.type === 999) {
            content.textContent = cell.rowIndex;                
            content.style.textAlign = 'center';
        }
        else if (col.type === 111) {
            content.style.textAlign = 'center';
        }
        else if (col.type === 1 || col.type === 2) {
            input = document.createElement('input');
            input.value = cell.value;
            // input.addEventListener('change', (ev) => {
            //     console.log('TODO', '[TableView] change', input);
            //     if (input.value !== cell.value && input.value !== "") {
            //         self.iTable.setCell(col.id, cell.rowId, input.value);
            //     }
            // });
            input.addEventListener('keydown', (ev) => {
                if (ev.key === 'Enter') {
                    input.blur();
                }
                else if (ev.key === 'Escape') {
                    ev.preventDefault();
                    input.style.display = 'none';
                    content.style.display = '';
                    input.value = content.textContent;
                }
            });
            input.addEventListener('blur', (ev) => {
                input.style.display = 'none';
                content.style.display = '';
                if (input.value !== "") {
                    self.iTable.setCell(col.id, cell.rowId, input.value);
                }
            });
            input.style.display = 'none';
            cellElem.appendChild(input);
            cellElem.addEventListener('dblclick', (ev) => {
                content.style.display = 'none';
                input.style.display = '';
                input.focus();
            });

            if (col.type === 2) {
                input.type = 'number';
                content.textContent = String(cell.value);
                content.style.textAlign = 'right';
            }
        }
        else if (col.type === 3) {
            content = Input('checkbox'); // @ts-ignore
            content.addEventListener('change', (ev) => {
                // @ts-ignore
                const value = content.checked;
                self.iTable.setCell(col.id, cell.rowId, value);
            });
            // @ts-ignore
            content.checked = typeof cell.value === 'boolean' ? cell.value : false;
        }
        else if (col.type === 42) {
            content = Select(self, { value: cell.value || 0, link: col.targetTableUuid });
        }
        
        if (content) cellElem.appendChild(content);
        if (input) {
            cellElem.appendChild(input);
            input.style.width = content.offsetWidth + "px";
            input.style.border = '0px';
        }
    
        return cellElem;
    }

    function findCellElem(cell) {
        const col = Array.from(columns.values()).find(col => col.id === cell.colId);
        const [cellElem, _] = Array.from(col.cells.entries()).find(([k,c]) => c.rowId === cell.rowId);
        return cellElem;
    }

    const subs = []; // collect subscriptions for unsubscribe
    subs.push(iTable.on('column-created', (col) => {
        // console.log('[TableView] column-created', col, that.uid);

        // create a new column, append to the table
        const colElem = Column(col);
        dummyColElem.before(colElem);

        const ruler = Ruler(colElem);
        colElem.after(ruler);
    }));

    subs.push(iTable.on('column-deleted', (col) => {
        console.log('[TableView] column-deleted', col, that.uid);

        columns.entries().forEach(([el, v]) => {
            if(v.id === col.id) {
                el.nextElementSibling.remove(); // ruler
                el.remove();
                columns.delete(el);
            }
        });
    }));

    subs.push(iTable.on('row-created', (row) => {
        // console.log('[TableView] row-created', row);

        for (const [colElem, col] of columns.entries()) {
            const cell = {
                value: row.data[col.id], 
                rowIndex: rowCount, 
                rowId: row.id,
                type: col.type
            };
            const cellElem = Cell({ col, cell });
            colElem.appendChild(cellElem);
            col.cells.set(cellElem, cell);
        }
        rowCount++;
    }));

    subs.push(iTable.on('row-deleted', (row) => {
        console.log('TODO:', '[TableView] on row-deleted', row);
        const cellsToRemove = [];
        columns.values().forEach(col => {
            col.cells.entries().forEach(([cellElem, cell]) => {
                if (cell.rowId === row.id) {
                    cellElem.remove();
                    col.cells.delete(cellElem);
                }
            });
        });
        // TODO: find all cells and remove them
    }));

    subs.push(iTable.on('cell-changed', (cell) => {
        // console.log('[TableView] cell-changed', cell);
        
        // find cell element by (colId, rowId)
        const col = Array.from(columns.values()).find(col => col.id === cell.colId);
        const [cellElem, _] = Array.from(col.cells.entries()).find(([k,c]) => c.rowId === cell.rowId);

        if (col.type === 42) {
            const select = cellElem.querySelector('select');
            select.value = String(cell.newValue);
        }
        else if (col.type === 1) {
            const label = cellElem.querySelector('span');
            label.textContent = cell.newValue;            
        }
        else if (col.type === 2) {
            const label = cellElem.querySelector('span');
            label.textContent = String(cell.newValue);
        }
        else if (col.type === 3) {
            const checkbox = cellElem.querySelector('input');
            checkbox.checked = cell.newValue;
        }
    }));

    return {
        getHost: () => host,
        getInstance: () => ({subs})
    };
}

function Ruler(colElem) {
    const ruler = Div();
    ruler.className = "ruler";
    const thumb = Div();
    thumb.className = "thumb";
    ruler.appendChild(thumb);
    thumb.addEventListener('mousedown', function(ev) {
        resizeColumn(ev, colElem);
        thumb.classList.add('dragging');     
    });
    return ruler;
}

const ITableView = (instance) => ({
    unsubscribe: () => { for(const sub of instance.subs) sub(); }
});

const info = {
    clsid: 'jscom.dom-comps.table-view',
    name: 'TableView',
    description: 'Editable cells in matrix form'
};

DOM.register(ctor, (role) => {
    role('TableView', ITableView, true);
}, info);

export default info.clsid;
