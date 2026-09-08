function createTreeInterface(model, config = {}) {
    const tableIcons = config.icons || {};
    
    function getIcon(tableName) {
        return tableIcons[tableName] || '📄';
    }
    
    function getRowLabel(table, rowId) {
        const row = table.getRow(rowId);
        if (!row) return `Row ${rowId}`;

        const nameColumn = table.forColumns((col) => col.name === 'name');
        const name = row.data[nameColumn.colId];
        if (nameColumn && name) {
            return name;
        }
        
        const stringColumn = table.forColumns((col) => col.type === 1);
        const str = row.data[stringColumn.colId];
        if (stringColumn && str) {
            return str;
        }
        
        return `Row ${rowId}`;
    }
    
    function findChildren(tableUuid, parentRowId) {
        const children = [];
        
        for (const otherTable of model.tables.values()) {
            for (const column of otherTable.columns) {
                if (column.type === 42 && column.targetTableUuid === tableUuid) {
                    for (const row of otherTable.rows) {
                        if (row.data[column.colId] === parentRowId) {
                            children.push({
                                tableUuid: otherTable.uuid,
                                rowId: row.id,
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
        
        table.forRows((row) => {
            const visited = new Set();
            const stack = [{
                tableUuid: rootTableUuid,
                rowId: row.id,
                parentNode: null
            }];
            
            while (stack.length > 0) {
                const { tableUuid, rowId, parentNode } = stack.pop();
                const key = `${tableUuid}:${rowId}`;
                
                if (visited.has(key)) continue;
                visited.add(key);
                
                const currentTable = model.getTable(tableUuid);
                const node = {
                    label: getRowLabel(currentTable, rowId),
                    icon: getIcon(currentTable.name),
                    type: 'folder',
                    data: { tableUuid, rowId },
                    children: []
                };
                
                if (parentNode) {
                    parentNode.children.push(node);
                } else {
                    rootNodes.push(node);
                    if (!firstRoot) firstRoot = node;
                }
                
                const childRefs = findChildren(tableUuid, rowId);
                for (let i = childRefs.length - 1; i >= 0; i--) {
                    stack.push({
                        tableUuid: childRefs[i].tableUuid,
                        rowId: childRefs[i].rowId,
                        parentNode: node
                    });
                }
            }
        });
        
        return { tree: rootNodes, firstRoot };
    }
    
    function getChildren(tableUuid, rowId) {
        const childRefs = findChildren(tableUuid, rowId);
        
        return childRefs.map(ref => {
            const otherTable = model.getTable(ref.tableUuid);
            return {
                label: getRowLabel(otherTable, ref.rowId),
                icon: getIcon(otherTable.name),
                type: 'folder',
                data: { tableUuid: ref.tableUuid, rowId: ref.rowId }
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