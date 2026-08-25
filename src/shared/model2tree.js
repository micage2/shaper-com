function createTreeInterface(model) {
    
    function getRowLabel(table, rowIdx) {
        const row = table.rows[rowIdx];
        if (!row) return `Row ${rowIdx}`;
        
        const nameColumn = table.columns.find(col => col.name === 'name');
        if (nameColumn) {
            return row.data[nameColumn.colId] || `Row ${rowIdx}`;
        }
        
        const stringColumn = table.columns.find(col => col.type === 1);
        if (stringColumn) {
            return row.data[stringColumn.colId] || `Row ${rowIdx}`;
        }
        
        return `Row ${rowIdx}`;
    }
    
    function findChildren(tableUuid, rowIdx) {
        const children = [];
        
        for (const otherTable of model.tables.values()) {
            for (const column of otherTable.columns) {
                if (column.type === 42 && column.targetTableUuid === tableUuid) {
                    for (let i = 0; i < otherTable.rows.length; i++) {
                        const row = otherTable.rows[i];
                        if (row.data[column.colId] === rowIdx) {
                            children.push({
                                tableUuid: otherTable.uuid,
                                rowIdx: i
                            });
                        }
                    }
                }
            }
        }
        
        return children;
    }
    
    return {
        buildTree(rootTableUuid) {
            const table = model.getTable(rootTableUuid);
            if (!table) return [];
            
            const roots = [];
            const visited = new Set();
            
            for (let idx = table.rows.length - 1; idx >= 0; idx--) {
                const stack = [{ 
                    tableUuid: rootTableUuid, 
                    rowIdx: idx, 
                    parentNode: null 
                }];
                
                while (stack.length > 0) {
                    const { tableUuid, rowIdx, parentNode } = stack.pop();
                    const key = `${tableUuid}:${rowIdx}`;
                    
                    if (visited.has(key)) continue;
                    visited.add(key);
                    
                    const currentTable = model.getTable(tableUuid);
                    const node = {
                        label: getRowLabel(currentTable, rowIdx),
                        icon: '📄',
                        type: 'folder',
                        data: { tableUuid, rowId: rowIdx },
                        children: []
                    };
                    
                    if (parentNode) {
                        parentNode.children.push(node);
                    } else {
                        roots.push(node);
                    }
                    
                    const childRefs = findChildren(tableUuid, rowIdx);
                    for (let i = childRefs.length - 1; i >= 0; i--) {
                        stack.push({
                            tableUuid: childRefs[i].tableUuid,
                            rowIdx: childRefs[i].rowIdx,
                            parentNode: node
                        });
                    }
                }
            }
            
            return roots;
        }
    };
}

export { createTreeInterface };