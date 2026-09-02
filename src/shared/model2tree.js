function createTreeInterface(model, config = {}) {
    const tableIcons = config.icons || {};
    
    function getIcon(tableName) {
        return tableIcons[tableName] || '📄';
    }
    
    function getRowLabel(table, rowIdx) {
        const row = table.rows[rowIdx];
        if (!row) return `Row ${rowIdx}`;
        
        const nameColumn = table.columns.find(col => col.name === 'name');
        if (nameColumn && row.data[nameColumn.colId]) {
            return row.data[nameColumn.colId];
        }
        
        const stringColumn = table.columns.find(col => col.type === 1);
        if (stringColumn && row.data[stringColumn.colId]) {
            return row.data[stringColumn.colId];
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
    
    function buildTree(rootTableUuid) {
        const table = model.getTable(rootTableUuid);
        if (!table) return { tree: [], firstRoot: null };
        
        const rootNodes = [];
        let firstRoot = null;
        
        for (let rootIdx = 0; rootIdx < table.rows.length; rootIdx++) {
            const visited = new Set();
            const stack = [{
                tableUuid: rootTableUuid,
                rowIdx: rootIdx,
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
                    icon: getIcon(currentTable.name),
                    type: 'folder',
                    data: { tableUuid, rowId: rowIdx },
                    children: []
                };
                
                if (parentNode) {
                    parentNode.children.push(node);
                } else {
                    rootNodes.push(node);
                    if (!firstRoot) firstRoot = node;
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
        
        return { tree: rootNodes, firstRoot };
    }
    
    function getChildren(tableUuid, rowIdx) {
        const childRefs = findChildren(tableUuid, rowIdx);
        
        return childRefs.map(ref => {
            const otherTable = model.getTable(ref.tableUuid);
            return {
                label: getRowLabel(otherTable, ref.rowIdx),
                icon: getIcon(otherTable.name),
                type: 'folder',
                data: { tableUuid: ref.tableUuid, rowId: ref.rowIdx }
            };
        });
    }
    
    return {
        buildTree,
        getChildren,
        getTableIcon: getIcon
    };
}

export { createTreeInterface };