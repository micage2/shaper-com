function createTreeInterface(model, config = {}) {
    const tableIcons = config.icons || {};
    
    function getIcon(tableName) {
        return tableIcons[tableName] || '📄';
    }
    
    function getRowLabel(table, rowIdx, linkColumnName = null) {
        const row = table.rows[rowIdx];
        if (!row) return `Row ${rowIdx}`;
        
        let displayName = null;
        
        const nameColumn = table.columns.find(col => col.name === 'name');
        if (nameColumn && row.data[nameColumn.colId]) {
            displayName = row.data[nameColumn.colId];
        }
        
        if (!displayName) {
            for (const column of table.columns) {
                if (column.type === 42 && column.targetTableUuid) {
                    const targetTable = model.getTable(column.targetTableUuid);
                    if (targetTable && targetTable.columns.some(col => col.name === 'name')) {
                        const targetRowIdx = row.data[column.colId];
                        if (targetRowIdx !== null && targetRowIdx !== undefined) {
                            displayName = getRowLabel(targetTable, targetRowIdx).split(' (')[0];
                            break;
                        }
                    }
                }
            }
        }
        
        if (!displayName) {
            const stringColumn = table.columns.find(col => col.type === 1);
            if (stringColumn) {
                displayName = row.data[stringColumn.colId];
            }
        }
        
        if (!displayName) {
            displayName = `Row ${rowIdx}`;
        }
        
        return `${displayName} (${table.name})`;
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
                                rowIdx: i,
                                linkColumnName: column.name
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
            
            const rootNodes = [];
            
            for (let idx = 0; idx < table.rows.length; idx++) {
                const visited = new Set();
                const stack = [{
                    tableUuid: rootTableUuid,
                    rowIdx: idx,
                    parentNode: null,
                    linkColumnName: null
                }];
                
                while (stack.length > 0) {
                    const { tableUuid, rowIdx, parentNode, linkColumnName } = stack.pop();
                    const key = `${tableUuid}:${rowIdx}`;
                    
                    if (visited.has(key)) continue;
                    visited.add(key);
                    
                    const currentTable = model.getTable(tableUuid);
                    const node = {
                        label: getRowLabel(currentTable, rowIdx, linkColumnName),
                        icon: getIcon(currentTable.name),
                        type: 'folder',
                        data: { tableUuid, rowId: rowIdx },
                        children: []
                    };
                    
                    if (parentNode) {
                        parentNode.children.push(node);
                    } else {
                        rootNodes.push(node);
                    }
                    
                    const childRefs = findChildren(tableUuid, rowIdx);
                    for (let i = childRefs.length - 1; i >= 0; i--) {
                        stack.push({
                            tableUuid: childRefs[i].tableUuid,
                            rowIdx: childRefs[i].rowIdx,
                            parentNode: node,
                            linkColumnName: childRefs[i].linkColumnName
                        });
                    }
                }
            }
            
            return rootNodes;
        },
        
        getChildren(tableUuid, rowIdx) {
            const table = model.getTable(tableUuid);
            if (!table) return [];
            
            const childRefs = findChildren(tableUuid, rowIdx);
            
            return childRefs.map(ref => {
                const otherTable = model.getTable(ref.tableUuid);
                return {
                    label: getRowLabel(otherTable, ref.rowIdx, ref.linkColumnName),
                    icon: getIcon(otherTable.name),
                    type: 'folder',
                    data: { tableUuid: ref.tableUuid, rowId: ref.rowIdx }
                };
            });
        }
    };
}

export { createTreeInterface };