function createGridDataAdapter(iTable) {
    const cellChangeHandlers = new Set();
    const rowsChangeHandlers = new Set();
    
    // Subscribe to table events
    iTable.on('row.added', () => {
        rowsChangeHandlers.forEach(handler => handler());
    });
    
    iTable.on('row.deleted', () => {
        rowsChangeHandlers.forEach(handler => handler());
    });
    
    iTable.on('cell.changed', (data) => {
        cellChangeHandlers.forEach(handler => handler(data));
    });
    
    return {
        getColumns() {
            return iTable.getColumns().map(col => ({
                name: col.name,
                type: col.type
            }));
        },
        
        getRowCount() {
            return iTable.getRows().length;
        },
        
        getCell(rowIdx, colName) {
            const row = iTable.getRow(rowIdx);
            if (!row) return null;
            return row.getCell(colName);
        },
        
        setCell(rowIdx, colName, value) {
            const row = iTable.getRow(rowIdx);
            if (!row) return false;
            row.setCell(colName, value);
            return true;
        },
        
        onCellChanged(callback) {
            cellChangeHandlers.add(callback);
        },
        
        onRowsChanged(callback) {
            rowsChangeHandlers.add(callback);
        }
    };
}

export { createGridDataAdapter };