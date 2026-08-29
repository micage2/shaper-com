function createRowDataInterface(model, tableUuid, rowIdx) {
    const table = model.getTable(tableUuid);
    if (!table) return null;
    
    const callbacks = new Set();
    
    table.on('cell.changed', (data) => {
        if (data.rowIdx === rowIdx) {
            callbacks.forEach(cb => cb());
        }
    });
    
    return {
        getColumns() {
            return table.columns.map(col => ({
                colId: col.colId,
                name: col.name,
                type: col.type,
                targetTableUuid: col.targetTableUuid
            }));
        },
        
        getValue(colId) {
            return table.getCell(rowIdx, colId);
        },
        
        setValue(colId, value) {
            table.setCell(rowIdx, colId, value);
        },
        
        getLinkInfo(colId) {
            const column = table.columns.find(col => col.colId === colId);
            if (!column || column.type !== 42) return null;
            
            const targetTable = model.getTable(column.targetTableUuid);
            if (!targetTable) return null;
            
            const nameColumn = targetTable.columns.find(col => col.name === 'name');
            return targetTable.rows.map((row, idx) => ({
                idx: idx,
                name: nameColumn ? row.data[nameColumn.colId] : `Row ${idx}`
            }));
        },
        
        onValueChanged(callback) {
            callbacks.add(callback);
        }
    };
}

export { createRowDataInterface };