function createTreeInterface(model) {
    
    return {
        buildTree(rootTableUuid) {
            const table = model.getTable(rootTableUuid);
            if (!table) return [];
            
            const items = [];
            const visited = new Set();
            const stack = [];
            
            for (let idx = table.rows.length - 1; idx >= 0; idx--) {
                stack.push({ tableUuid: rootTableUuid, rowIdx: idx, depth: 0 });
            }
            
            while (stack.length > 0) {
                const { tableUuid, rowIdx, depth } = stack.pop();
                const key = `${tableUuid}:${rowIdx}`;
                
                if (visited.has(key)) continue;
                visited.add(key);
                
                const currentTable = model.getTable(tableUuid);
                const row = currentTable.rows[rowIdx];
                const nameColumn = currentTable.columns.find(col => col.name === 'name');
                const label = nameColumn ? row.data[nameColumn.colId] : `Row ${rowIdx}`;
                
                items.push({
                    label: label,
                    icon: '📄',
                    type: 'folder',
                    depth: depth,
                    data: { tableUuid, rowId: rowIdx }
                });
                
                const children = [];
                for (const otherTable of model.tables.values()) {
                    for (const column of otherTable.columns) {
                        if (column.type === 42 && column.targetTableUuid === tableUuid) {
                            for (let i = 0; i < otherTable.rows.length; i++) {
                                if (otherTable.rows[i].data[column.colId] === rowIdx) {
                                    children.push({ 
                                        tableUuid: otherTable.uuid, 
                                        rowIdx: i, 
                                        depth: depth + 1 
                                    });
                                }
                            }
                        }
                    }
                }
                
                for (let i = children.length - 1; i >= 0; i--) {
                    stack.push(children[i]);
                }
            }
            
            return items;
        }
    };
}

export { createTreeInterface };