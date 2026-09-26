import { Mediator } from '../shared/mediator.js';

export default function Model() {
    const tables = new Map();  // tableUuid -> { uuid, name, columns: Map, rows: Map, nextRowId }
    const hub = new Mediator();

    console.log('TODO:', '[DB]', 'new column ids');
    console.log('TODO:', '[DB]', 'new loader without ids');
    
    function generateUuid() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'uuid-' + Math.random().toString(36).substr(2, 9);
    }
    
    // === Events ===
    function on(event, handler) {
        return hub.on(event, handler);
    }
    
    function off(event, handler) {
        hub.off(event, handler);
    }
    
    function emit(event, data) {
        hub.emit(event, data);
    }
    
    // === Tables ===
    function createTable(name) {
        const uuid = generateUuid();
        const table = {
            uuid,
            name,
            columns: new Map(),
            rows: new Map(),
            nextRowId: 0
        };
        
        const nameColId = generateUuid();
        table.columns.set(nameColId, {
            id: nameColId,
            name: 'name',
            type: 1,
            targetTableUuid: null
        });
        
        tables.set(uuid, table);
        
        emit('db-table-created', { uuid, name });
        emit('db-column-created', {
            tableUuid: uuid,
            id: nameColId,
            name: 'name',
            type: 1,
            targetTableUuid: null
        });
        
        return uuid;
    }
    
    function deleteTable(tableUuid) {
        const table = tables.get(tableUuid);
        if (!table) return false;
        
        tables.delete(tableUuid);
        emit('db-table-deleted', { uuid: table.uuid, name: table.name });
        return true;
    }
    
    function renameTable(tableUuid, newName) {
        const table = tables.get(tableUuid);
        if (!table) return false;
        
        const oldName = table.name;
        table.name = newName;
        emit('db-table-renamed', {  uuid: table.uuid, name: table.name, oldName, newName });
        return true;
    }
    
    // examples:
    // db.forTables(); returns all table info
    // db.forTables(table => true, "one") returns first table info
    // db.forTables(table => true, "all") returns all table info
    // db.forTables(table => false, "all") returns []
    // db.forTables(table => table.name[0] === 'C', 'all') returns all table infos for cities starting with 'C'
    // db.forTables(table => table.name[0] === 'C', 'one') returns table info for first city starting with 'C'
    function forTables(callback, option = 'all') {
        if (typeof callback === 'function') {
            const infos = [];
            for (const table of tables.values()) {
                const info = { uuid: table.uuid, name: table.name };
                if (callback(info)) {
                    if (option === 'one') return info;
                    else infos.push(info);
                }
            }
            return option === 'all' ? infos : null;
        }
        else {
            return [...tables.values().map(t => ({ uuid: t.uuid, name: t.name }))];
        }
    }
    
    function getTableInfo(tableUuid) {
        const table = tables.get(tableUuid);
        return table ? { uuid: table.uuid, name: table.name } : null;
    }
    
    // === Columns ===
    function createColumn(tableUuid, spec) {
        const table = tables.get(tableUuid);
        if (!table) return false;
        
        for (const col of table.columns.values()) {
            if (col.name === spec.name) {
                console.error(`[Model] Column '${spec.name}' already exists`);
                return false;
            }
        }
        
        if (![1, 2, 3, 42].includes(spec.type)) {
            console.error(`[Model] Invalid column type: ${spec.type}`);
            return false;
        }
        
        let firstTargetRowId = null;
        if (spec.type === 42) {
            if (!spec.targetTableUuid) {
                console.error('[Model] Link column requires targetTableUuid');
                return false;
            }
            const targetTable = tables.get(spec.targetTableUuid);
            if (!targetTable) {
                console.error('[Model] Link target table not found');
                return false;
            }
            for (const row of targetTable.rows.values()) {
                firstTargetRowId = row.id;
                break;
            }
            if (firstTargetRowId === null) {
                console.error('[Model] Link target table has no rows');
                return false;
            }
        }
        
        const id = generateUuid();
        const column = {
            id,
            name: spec.name,
            type: spec.type,
            targetTableUuid: spec.targetTableUuid || null
        };
        table.columns.set(id, column);
        
        for (const row of table.rows.values()) {
            let defaultValue;
            if (spec.type === 42) defaultValue = firstTargetRowId;
            else if (spec.type === 1) defaultValue = '';
            else if (spec.type === 2) defaultValue = 0;
            else if (spec.type === 3) defaultValue = false;
            else defaultValue = null;
            
            row.data[id] = defaultValue;
        }
        
        emit('db-column-created', {
            tableUuid,
            id,
            name: spec.name,
            type: spec.type,
            targetTableUuid: column.targetTableUuid
        });
        
        return id;
    }
    
    function deleteColumn(tableUuid, colId) {
        const table = tables.get(tableUuid);
        if (!table) return false;
        const column = table.columns.get(colId);
        if (!column) return false;
        
        table.columns.delete(colId);
        
        for (const row of table.rows.values()) {
            delete row.data[colId];
        }
        
        emit('db-column-deleted', {
            tableUuid,
            id: colId,
            name: column.name
        });
        
        return true;
    }
    
    function renameColumn(tableUuid, colId, newName) {
        const table = tables.get(tableUuid);
        if (!table) return false;
        const column = table.columns.get(colId);
        if (!column) return false;
        
        for (const col of table.columns.values()) {
            if (col.name === newName) {
                console.error(`[Model] Column '${newName}' already exists`);
                return false;
            }
        }
        
        const oldName = column.name;
        column.name = newName;
        emit('db-column-renamed', { tableUuid, id: colId, oldName, newName });
        return true;
    }
    
    function forColumns(tableUuid, callback) {
        const table = tables.get(tableUuid);
        if (!table) return [];

        if (typeof callback === 'function') {        
            for (const col of table.columns.values()) {
                if (callback(col)) return col;
            }
        }
        else {
            return [...table.columns.values()];
        }
    }
    
    function getColumn(tableUuid, colId) {
        const table = tables.get(tableUuid);
        if (!table) return null;
        const col = table.columns.get(colId);
        if (!col) return null;
        return {
            id: col.id,
            name: col.name,
            type: col.type,
            targetTableUuid: col.targetTableUuid
        };
    }
    
    function getColumns(tableUuid) {
        const table = tables.get(tableUuid);
        if (!table) return [];
        
        return Array.from(table.columns.values()).map(col => ({
            id: col.id,
            name: col.name,
            type: col.type,
            targetTableUuid: col.targetTableUuid
        }));
    }
    
    // === Rows ===
    function createRow(tableUuid, rowData = {}) {
        const table = tables.get(tableUuid);
        if (!table) return null;
        
        const data = {};
        
        for (const col of table.columns.values()) {
            if (col.type === 1) data[col.id] = '';
            else if (col.type === 2) data[col.id] = 0;
            else if (col.type === 3) data[col.id] = false;
            else if (col.type === 42) data[col.id] = 0;
        }
        
        for (const [key, value] of Object.entries(rowData)) {
            for (const col of table.columns.values()) {
                if (col.id === key || col.name === key) {
                    data[col.id] = value;
                }
            }
        }
        
        const id = table.nextRowId++;
        const row = { id, data };
        table.rows.set(id, row);
        
        for (const col of table.columns.values()) {
            if (col.type === 42) {
                const current = row.data[col.id];
                if (current === null || current === undefined) {
                    const targetTable = tables.get(col.targetTableUuid);
                    if (targetTable) {
                        for (const targetRow of targetTable.rows.values()) {
                            row.data[col.id] = targetRow.id;
                            break;
                        }
                    }
                }
            }
        }
        
        emit('db-row-created', { tableUuid, id, data: { ...row.data } });
        return id;
    }
    
    function deleteRow(tableUuid, rowId, opts = {}) {
        const cascade = opts.cascade !== false;
        const table = tables.get(tableUuid);
        if (!table || !table.rows.has(rowId)) return false;
        
        const deleted = [];
        
        if (cascade) {
            const stack = [{ tableUuid, rowId }];
            
            while (stack.length > 0) {
                const { tableUuid: tUuid, rowId: rId } = stack.pop();
                const t = tables.get(tUuid);
                if (!t || !t.rows.has(rId)) continue;
                
                const children = findChildren(tUuid, rId);
                for (const child of children) {
                    stack.push({ tableUuid: child.tableUuid, rowId: child.rowId });
                }
                
                t.rows.delete(rId);
                emit('db-row-deleted', { tableUuid: tUuid, id: rId });
                deleted.push({ tableUuid: tUuid, rowId: rId });
            }
        } else {
            table.rows.delete(rowId);
            emit('db-row-deleted', { tableUuid, id: rowId });
            deleted.push({ tableUuid, rowId });
        }
        
        return deleted;
    }
    
    function forRows(tableUuid, callback) {
        const table = tables.get(tableUuid);
        if (!table) return [];

        if (typeof callback === 'function') {        
            for (const row of table.rows.values()) {
                if (callback(row)) return [row];
            }
        }        
        else {
            return [...table.rows.values()];
        }
    }
    
    function getRow(tableUuid, rowId) {
        const table = tables.get(tableUuid);
        if (!table) return null;
        const row = table.rows.get(rowId);
        if (!row) return null;
        return { id: row.id, data: row.data };
    }
    
    function getRows(tableUuid) {
        const table = tables.get(tableUuid);
        if (!table) return [];
        
        return Array.from(table.rows.values()).map(row => ({
            id: row.id,
            data: { ...row.data }
        }));
    }
    
    // === Cells ===
    function setCell(tableUuid, rowId, colId, value) {
        const table = tables.get(tableUuid);
        if (!table) return false;
        const row = table.rows.get(rowId);
        if (!row) return false;
        if (!(colId in row.data)) return false;
        
        const oldValue = row.data[colId];
        row.data[colId] = value;
        
        const col = table.columns.get(colId);
        emit('db-cell-changed', {
            tableUuid,
            rowId,
            colId,
            columnName: col ? col.name : '',
            oldValue,
            newValue: value
        });
        
        return true;
    }
    
    function getCell(tableUuid, rowId, colId) {
        const table = tables.get(tableUuid);
        if (!table) return null;
        const row = table.rows.get(rowId);
        if (!row) return null;
        if (!(colId in row.data)) return null;
        return row.data[colId];
    }
    
    // === Trees ===
    function findChildren(tableUuid, rowId) {
        const children = [];
        
        for (const otherTable of tables.values()) {
            for (const col of otherTable.columns.values()) {
                if (col.type === 42 && col.targetTableUuid === tableUuid) {
                    for (const row of otherTable.rows.values()) {
                        if (row.data[col.id] === rowId) {
                            children.push({
                                tableUuid: otherTable.uuid,
                                rowId: row.id
                            });
                        }
                    }
                }
            }
        }
        
        return children;
    }
    
    function buildTree(tableUuid) {
        const table = tables.get(tableUuid);
        if (!table) return [];
        
        const rootNodes = [];
        
        for (const row of table.rows.values()) {
            const visited = new Set();
            const stack = [{
                tableUuid,
                rowId: row.id,
                parentNode: null
            }];
            
            while (stack.length > 0) {
                const { tableUuid: tUuid, rowId: rId, parentNode } = stack.pop();
                const key = `${tUuid}:${rId}`;
                
                if (visited.has(key)) continue;
                visited.add(key);
                
                const node = {
                    tableUuid: tUuid,
                    rowId: rId,
                    children: []
                };
                
                if (parentNode) {
                    parentNode.children.push(node);
                } else {
                    rootNodes.push(node);
                }
                
                const childRefs = findChildren(tUuid, rId);
                for (let i = childRefs.length - 1; i >= 0; i--) {
                    stack.push({
                        tableUuid: childRefs[i].tableUuid,
                        rowId: childRefs[i].rowId,
                        parentNode: node
                    });
                }
            }
        }
        
        return rootNodes;
    }
    
    // === Load ===
    function load(data) {
        tables.clear();
        
        // Pass 1: bulk fill silently
        for (const tableData of data.tables) {
            const table = {
                uuid: tableData.uuid,
                name: tableData.name,
                columns: new Map(),
                rows: new Map(),
                nextRowId: 0
            };
            
            for (const colData of tableData.columns) {
                table.columns.set(colData.colId, {
                    id: colData.colId,
                    name: colData.name,
                    type: colData.type,
                    targetTableUuid: colData.targetTableUuid || null
                });
            }
            
            let hasName = false;
            for (const col of table.columns.values()) {
                if (col.name === 'name') { hasName = true; break; }
            }
            if (!hasName) {
                const id = generateUuid();
                const newColumns = new Map();
                newColumns.set(id, {
                    id,
                    name: 'name',
                    type: 1,
                    targetTableUuid: null
                });
                for (const [k, col] of table.columns) {
                    newColumns.set(k, col);
                }
                table.columns = newColumns;
            }
            
            let maxRowId = -1;
            for (const rowData of tableData.rows) {
                table.rows.set(rowData.id, {
                    id: rowData.id,
                    data: { ...rowData.data }
                });
                if (rowData.id > maxRowId) maxRowId = rowData.id;
            }
            table.nextRowId = maxRowId + 1;
            
            if (!hasName) {
                for (const row of table.rows.values()) {
                    for (const col of table.columns.values()) {
                        if (col.name === 'name') {
                            row.data[col.id] = `${table.name} #${row.id}`;
                            break;
                        }
                    }
                }
            }
            
            tables.set(table.uuid, table);
        }
        
        // Pass 2: sanitize link values
        for (const table of tables.values()) {
            for (const col of table.columns.values()) {
                if (col.type !== 42) continue;
                
                const targetTable = tables.get(col.targetTableUuid);
                if (!targetTable) continue;
                
                let firstTargetRowId = null;
                for (const row of targetTable.rows.values()) {
                    firstTargetRowId = row.id;
                    break;
                }
                if (firstTargetRowId === null) continue;
                
                for (const row of table.rows.values()) {
                    const value = row.data[col.id];
                    const valid = value !== null && value !== undefined && targetTable.rows.has(value);
                    if (!valid) {
                        row.data[col.id] = firstTargetRowId;
                    }
                }
            }
        }
    }
    
    function replay() {
        for (const table of tables.values()) {
            emit('db-table-created', table);
            
            for (const col of table.columns.values()) {
                emit('db-column-created', { tableUuid: table.uuid, ...col });
            }
            
            for (const row of table.rows.values()) {
                emit('db-row-created', {
                    tableUuid: table.uuid,
                    id: row.id,
                    data: { ...row.data }
                });
            }
        }
    }
    
    function save() {
        return {
            tables: Array.from(tables.values()).map(table => ({
                uuid: table.uuid,
                name: table.name,
                columns: Array.from(table.columns.values()).map(col => ({
                    colId: col.id,
                    name: col.name,
                    type: col.type,
                    ...(col.targetTableUuid ? { targetTableUuid: col.targetTableUuid } : {})
                })),
                rows: Array.from(table.rows.values()).map(row => ({
                    id: row.id,
                    data: { ...row.data }
                }))
            }))
        };
    }
    
    return {
        on, off, emit,
        createTable, deleteTable, renameTable, forTables, getTableInfo,
        createColumn, deleteColumn, renameColumn, forColumns, getColumn, getColumns,
        createRow, deleteRow, forRows, getRow, getRows,
        setCell, getCell,
        findChildren, buildTree,
        load, save
    };
}