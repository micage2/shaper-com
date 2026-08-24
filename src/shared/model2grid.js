function createGridInterface(model, tableUuid) {
    const table = model.getTable(tableUuid);
    if (!table) return null;
    
    const cellChangedHandlers = new Set();
    const rowAddedHandlers = new Set();
    const rowDeletedHandlers = new Set();
    const columnAddedHandlers = new Set();
    const columnRemovedHandlers = new Set();
    const columnRenamedHandlers = new Set();
    const columnSwappedHandlers = new Set();
    
    table.on('cell.changed', (data) => {
        cellChangedHandlers.forEach(handler => handler(data));
    });
    
    table.on('row.added', (data) => {
        const rowIdx = table.rows.findIndex(row => row.id === data.rowId);
        rowAddedHandlers.forEach(handler => handler({
            rowId: data.rowId,
            rowIdx: rowIdx,
            rowData: data.rowData
        }));
    });
    
    table.on('row.deleted', (data) => {
        rowDeletedHandlers.forEach(handler => handler(data));
    });
    
    table.on('column.added', (data) => {
        columnAddedHandlers.forEach(handler => handler(data));
    });
    
    table.on('column.removed', (data) => {
        columnRemovedHandlers.forEach(handler => handler(data));
    });
    
    table.on('column.renamed', (data) => {
        columnRenamedHandlers.forEach(handler => handler(data));
    });
    
    table.on('column.swapped', (data) => {
        columnSwappedHandlers.forEach(handler => handler(data));
    });
    
    function createCellData(rowIdx, column) {
        const callbacks = new Set();
        
        table.onCellChanged(rowIdx, column.colId, (newValue) => {
            callbacks.forEach(cb => cb(newValue));
        });
        
        return {
            getValue() {
                return table.getCell(rowIdx, column.colId);
            },
            
            getType() {
                return column.type;
            },
            
            getLinkInfo() {
                if (column.type !== 42) return null;
                const targetTable = model.getTable(column.targetTableUuid);
                if (!targetTable) return null;
                return targetTable.rows.map((row, idx) => ({
                    idx: idx,
                    name: row.data[Object.keys(row.data)[0]] || `Row ${idx}`
                }));
            },
            
            setValue(newValue) {
                table.setCell(rowIdx, column.colId, newValue);
            },
            
            onValueChanged(callback) {
                callbacks.add(callback);
            }
        };
    }
    
    return {
        // Create
        addRow(rowData = {}) {
            return table.addRow(rowData);
        },
        
        addColumn(spec) {
            return table.addColumn(spec);
        },
        
        // Read
        getName() {
            return table.name;
        },
        
        getColumns() {
            return table.columns.map(col => ({
                colId: col.colId,
                name: col.name,
                type: col.type,
                targetTableUuid: col.targetTableUuid
            }));
        },

        getColumn(colId) {
            return table.columns.find(col => col.colId === colId) || null;
        },
        
        getRowCount() {
            return table.rows.length;
        },
        
        getCellData(rowIdx, colIdOrName) {
            const column = table.columns.find(col => col.colId === colIdOrName || col.name === colIdOrName);
            if (!column) return null;
            return createCellData(rowIdx, column);
        },
        
        getLinkInfo(uuid) {
            const table = model.getTable(uuid);
            if (!table) return null;
            return table.rows.map((row, idx) => ({
                idx: idx,
                name: row.data[Object.keys(row.data)[0]] || `Row ${idx}`
            }));
        },
        
        // Update
        renameTable(newName) {
            return model.renameTable(tableUuid, newName);
        },
        
        renameColumn(colId, newName) {
            return table.renameColumn(colId, newName);
        },
        
        swapColumns(colId1, colId2) {
            return table.swapColumns(colId1, colId2);
        },
        
        // Delete
        deleteRow(rowIdx) {
            return table.deleteRow(rowIdx);
        },
        
        removeColumn(colId) {
            return table.removeColumn(colId);
        },
        
        deleteTable() {
            return model.deleteTable(tableUuid);
        },
        
        // Events
        onCellChanged(callback) {
            cellChangedHandlers.add(callback);
        },
        
        onRowAdded(callback) {
            rowAddedHandlers.add(callback);
        },
        
        onRowDeleted(callback) {
            rowDeletedHandlers.add(callback);
        },
        
        onColumnAdded(callback) {
            columnAddedHandlers.add(callback);
        },
        
        onColumnRemoved(callback) {
            columnRemovedHandlers.add(callback);
        },
        
        onColumnRenamed(callback) {
            columnRenamedHandlers.add(callback);
        },
        
        onColumnSwapped(callback) {
            columnSwappedHandlers.add(callback);
        }
    };
}

export { createGridInterface };