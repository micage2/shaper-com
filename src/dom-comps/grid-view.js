import { DomRegistry as DOM } from '../dom-registry.js';

function ctor(iGridData) {
    const self = this;
    
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'closed' });
    
    shadow.innerHTML = `
        <style>
            :host {
                display: block;
                width: 100%;
                height: 100%;
                overflow: auto;
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 13px;
                background: #fff;
            }
            .grid {
                display: flex;
                min-width: 100%;
                width: max-content;
            }
            .column {
                display: flex;
                flex-direction: column;
                flex-shrink: 0;
                min-width: 120px;
            }
            .cell {
                position: relative;
                height: 28px;
                min-height: 28px;
                padding: 0 8px;
                border-bottom: 1px solid #eee;
                border-right: 1px solid #ddd;
                white-space: nowrap;
                overflow: hidden;
                box-sizing: border-box;
                display: flex;
                align-items: center;
            }
            .cell-header {
                background: #f5f5f5;
                font-weight: bold;
                border-bottom: 1px solid #ccc;
            }
            .cell:hover {
                background: #fafafa;
            }
            .cell-idle {
                display: flex;
                align-items: center;
                width: 100%;
                height: 100%;
                user-select: none;
            }
            .cell-edit {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                display: none;
            }
            .cell-edit input[type="text"],
            .cell-edit input[type="number"],
            .cell-edit select {
                width: 100%;
                height: 100%;
                border: 1px solid #4a90d9;
                padding: 0 8px;
                font: inherit;
                box-sizing: border-box;
                margin: 0;
                background: #fff;
            }
            .cell-align-left {
                justify-content: flex-start;
            }
            .cell-align-right {
                justify-content: flex-end;
            }
            .cell-align-center {
                justify-content: center;
            }
        </style>
        <div class="grid"></div>
    `;
    
    const grid = shadow.querySelector('.grid');
    const columns = new Map();
    
    function createSimpleCell(value) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.textContent = value;
        cell.style.userSelect = 'none';
        return cell;
    }
    
    function createCellView(cellData) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        
        const type = cellData.getType();
        if (type === 2) {
            cell.classList.add('cell-align-right');
        } else if (type === 3) {
            cell.classList.add('cell-align-center');
        } else {
            cell.classList.add('cell-align-left');
        }
        
        const idleContainer = document.createElement('div');
        idleContainer.className = 'cell-idle';
        idleContainer.style.justifyContent = 'inherit';
        cell.appendChild(idleContainer);
        
        const editContainer = document.createElement('div');
        editContainer.className = 'cell-edit';
        cell.appendChild(editContainer);
        
        function display() {
            idleContainer.innerHTML = '';
            editContainer.innerHTML = '';
            editContainer.style.display = 'none';
            idleContainer.style.display = 'flex';
            
            const value = cellData.getValue();
            
            if (cellData.getType() === 3) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = value || false;
                checkbox.addEventListener('change', () => {
                    cellData.setValue(checkbox.checked);
                });
                idleContainer.appendChild(checkbox);
            } else if (cellData.getType() === 42) {
                const linkInfo = cellData.getLinkInfo();
                if (linkInfo && value !== null && value !== undefined) {
                    const option = linkInfo.find(opt => opt.idx === value);
                    idleContainer.textContent = option ? option.name : `Invalid (${value})`;
                } else {
                    idleContainer.textContent = '';
                }
            } else {
                idleContainer.textContent = value !== null && value !== undefined ? String(value) : '';
            }
        }
        
        function edit() {
            idleContainer.style.display = 'none';
            editContainer.style.display = 'flex';
            
            const type = cellData.getType();
            const value = cellData.getValue();
            
            if (type === 42) {
                const select = document.createElement('select');
                const emptyOption = document.createElement('option');
                emptyOption.value = '';
                emptyOption.textContent = '';
                select.appendChild(emptyOption);
                
                const linkInfo = cellData.getLinkInfo();
                if (linkInfo) {
                    for (const option of linkInfo) {
                        const opt = document.createElement('option');
                        opt.value = String(option.idx);
                        opt.textContent = option.name;
                        select.appendChild(opt);
                    }
                }
                
                if (value !== null && value !== undefined) {
                    select.value = String(value);
                }
                
                select.addEventListener('change', () => {
                    const newValue = select.value === '' ? null : Number(select.value);
                    cellData.setValue(newValue);
                    display();
                });
                
                select.addEventListener('blur', () => {
                    display();
                });
                
                editContainer.appendChild(select);
                select.focus();
            } else {
                const input = document.createElement('input');
                input.type = type === 2 ? 'number' : 'text';
                input.value = value !== null && value !== undefined ? String(value) : '';
                
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const newValue = type === 2 ? Number(input.value) : input.value;
                        cellData.setValue(newValue);
                        display();
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        display();
                    }
                });
                
                input.addEventListener('blur', () => {
                    const newValue = type === 2 ? Number(input.value) : input.value;
                    cellData.setValue(newValue);
                    display();
                });
                
                editContainer.appendChild(input);
                input.focus();
                input.select();
            }
        }
        
        if (cellData.getType() !== 3 && cellData.getType() !== 99) {
            idleContainer.addEventListener('dblclick', edit);
        }
        
        cellData.onValueChanged(() => {
            display();
        });
        
        display();
        return cell;
    }
    
    function addDeleteColumn() {
        const column = document.createElement('div');
        column.className = 'column';
        column.style.minWidth = '24px';
        column.style.width = '24px';
        
        const header = createSimpleCell('x');
        header.classList.add('cell-align-center');
        column.appendChild(header);
        
        const rowCount = iGridData.getRowCount();
        for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
            const cell = createDeleteCell(rowIdx);
            column.appendChild(cell);
        }
        
        grid.appendChild(column);
        columns.set('delete', column);
    }
    
    function addIndexColumn() {
        const column = document.createElement('div');
        column.className = 'column';
        column.style.minWidth = '40px';
        column.style.width = '40px';
        
        const header = createSimpleCell('#');
        header.classList.add('cell-align-center');
        column.appendChild(header);
        
        const rowCount = iGridData.getRowCount();
        for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
            const cell = createSimpleCell(String(rowIdx));
            cell.classList.add('cell-align-center');
            column.appendChild(cell);
        }
        
        grid.appendChild(column);
        columns.set('index', column);
    }
    
    function addColumn(columnData) {
        const column = document.createElement('div');
        column.className = 'column';
        
        const header = createSimpleCell(columnData.name);
        header.classList.add('cell-header');
        
        if (columnData.type === 2) {
            header.classList.add('cell-align-right');
        } else if (columnData.type === 3) {
            header.classList.add('cell-align-center');
        } else {
            header.classList.add('cell-align-left');
        }
        
        column.appendChild(header);
        
        const rowCount = iGridData.getRowCount();
        for (let rowIdx = 0; rowIdx < rowCount; rowIdx++) {
            const cellData = iGridData.getCellData(rowIdx, columnData.colId);
            if (cellData) {
                column.appendChild(createCellView(cellData));
            }
        }
        
        grid.appendChild(column);
        columns.set(columnData.colId, column);
    }
    
    function createDeleteCell(rowIdx) {
        const cell = createSimpleCell('×');
        cell.classList.add('cell-align-center');
        cell.style.cursor = 'pointer';
        cell.addEventListener('click', () => {
            iGridData.deleteRow(rowIdx);
        });
        return cell;
    }
    
    function removeColumn(colId) {
        const columnDiv = columns.get(colId);
        if (columnDiv) {
            columnDiv.remove();
            columns.delete(colId);
        }
    }
    
    function addRow(rowIdx) {
        const deleteColumn = columns.get('delete');
        if (deleteColumn) {
            deleteColumn.appendChild(createDeleteCell(rowIdx));
        }
        
        const indexColumn = columns.get('index');
        if (indexColumn) {
            const cell = createSimpleCell(String(rowIdx));
            cell.classList.add('cell-align-center');
            indexColumn.appendChild(cell);
        }
        
        const cols = iGridData.getColumns();
        for (const col of cols) {
            const column = columns.get(col.colId);
            if (column) {
                const cellData = iGridData.getCellData(rowIdx, col.colId);
                if (cellData) {
                    column.appendChild(createCellView(cellData));
                }
            }
        }
    }
    
    function removeRow(rowIdx) {
        for (const columnDiv of columns.values()) {
            const cell = columnDiv.children[rowIdx + 1]; // +1 for header
            if (cell) {
                cell.remove();
            }
        }
        
        // Refresh index cells
        const indexColumn = columns.get('index');
        if (indexColumn) {
            const cells = indexColumn.children;
            for (let i = 1; i < cells.length; i++) {
                cells[i].textContent = String(i - 1);
            }
        }
    }
    
    return {
        getHost() { return host; },
        getInstance() { 
            return { 
                iGridData,
                columns,
                addDeleteColumn, 
                addIndexColumn, 
                addColumn,
                removeColumn,
                addRow,
                removeRow
            }; 
        }
    };
}

const IGridView = (instance) => {
    const iface = {
        addDeleteColumn() {
            instance.addDeleteColumn();
            return this;
        },
        
        addIndexColumn() {
            instance.addIndexColumn();
            return this;
        },
        
        addColumn(column) {
            instance.addColumn(column);
            return this;
        },
        
        removeColumn(colId) {
            instance.removeColumn(colId);
            return this;
        }
    };
    
    instance.iGridData.onRowAdded((data) => {
        instance.addRow(data.rowIdx);
    });
    
    instance.iGridData.onRowDeleted((data) => {
        instance.removeRow(data.rowIdx);
    });
    
    instance.iGridData.onColumnAdded((data) => {
        const columns = instance.iGridData.getColumns();
        const column = columns.find(col => col.colId === data.colId);
        if (column) {
            instance.addColumn(column);
        }
    });
    
    instance.iGridData.onColumnRemoved((data) => {
        instance.removeColumn(data.colId);
    });
    
    return iface;
};

const info = {
    clsid: 'jscom.dom-comps.grid-view',
    name: 'GridView',
    description: 'Column-first table view'
};

DOM.register(ctor, (role) => {
    role('GridView', IGridView, true);
}, info);

export default info.clsid;