import { Table } from './table.js';
import { Column } from './column.js';

class Model {
    constructor() {
        this.tables = new Map();
        this.eventHandlers = new Map();
    }
    
    generateUuid() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'uuid-' + Math.random().toString(36).substr(2, 9);
    }
    
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(handler);
        return () => this.off(event, handler);
    }
    
    off(event, handler) {
        if (this.eventHandlers.has(event)) {
            this.eventHandlers.get(event).delete(handler);
        }
    }
    
    emit(event, data) {
        if (this.eventHandlers.has(event)) {
            for (const handler of this.eventHandlers.get(event)) {
                handler(data);
            }
        }
    }
    
    createTable(name) {
        const uuid = this.generateUuid();
        const table = new Table(uuid, name);
        
        const nameColumn = new Column('name', 1);
        table.columns.set(nameColumn.colId, nameColumn);
        
        this._subscribeTable(table);
        this.tables.set(uuid, table);
        
        this.emit('table-created', { uuid, name });
        table.emit('column-added', {
            tableUuid: uuid,
            colId: nameColumn.colId,
            columnName: nameColumn.name,
            type: nameColumn.type,
            targetTableUuid: null
        });
        
        return table;
    }
    
    deleteTable(uuid) {
        const table = this.tables.get(uuid);
        if (!table) return false;
        
        this.tables.delete(uuid);
        this.emit('table-deleted', { uuid, name: table.name });
        return true;
    }
    
    renameTable(uuid, newName) {
        const table = this.tables.get(uuid);
        if (!table) return false;
        
        const oldName = table.name;
        table.name = newName;
        this.emit('table-renamed', { uuid, oldName, newName });
        return true;
    }
    
    getTable(uuid) {
        const table = this.tables.get(uuid);
        if (!table) {
            console.error(`[Model] Table '${uuid}' not found`);
            return null;
        }
        return table;
    }
    
    addColumn(tableUuid, spec) {
        const table = this.getTable(tableUuid);
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
        
        let firstTargetRow = null;
        if (spec.type === 42) {
            if (!spec.targetTableUuid) {
                console.error('[Model] Link column requires targetTableUuid');
                return false;
            }
            const targetTable = this.getTable(spec.targetTableUuid);
            if (!targetTable) {
                console.error('[Model] Link target table not found');
                return false;
            }
            firstTargetRow = targetTable.forRows(() => true);
            if (!firstTargetRow) {
                console.error('[Model] Link target table has no rows');
                return false;
            }
        }
        
        const column = new Column(spec.name, spec.type, spec.targetTableUuid || null);
        table.columns.set(column.colId, column);
        
        const defaultValue = (spec.type === 42 && firstTargetRow) ? firstTargetRow.id : column.defaultValue;
        for (const row of table.rows.values()) {
            row.data[column.colId] = defaultValue;
        }
        
        table.emit('column-added', {
            tableUuid: table.uuid,
            colId: column.colId,
            columnName: column.name,
            type: column.type,
            targetTableUuid: column.targetTableUuid
        });
        
        return column;
    }

    addRow(tableUuid, rowData = {}) {
        const table = this.getTable(tableUuid);
        if (!table) return null;
        
        const row = table._addRow(rowData);
        
        // Set default link values for any remaining null links
        for (const column of table.columns.values()) {
            if (column.type === 42) {
                const current = row.data[column.colId];
                if (current === null || current === undefined) {
                    const targetTable = this.getTable(column.targetTableUuid);
                    if (targetTable) {
                        const firstTargetRow = targetTable.forRows(() => true);
                        if (firstTargetRow) {
                            table.setCell(row.id, column.colId, firstTargetRow.id);
                        }
                    }
                }
            }
        }
        
        return row;
    }
    
    findChildren(tableUuid, rowId) {
        const children = [];
        
        for (const otherTable of this.tables.values()) {
            for (const column of otherTable.columns.values()) {
                if (column.type === 42 && column.targetTableUuid === tableUuid) {
                    for (const row of otherTable.rows.values()) {
                        if (row.data[column.colId] === rowId) {
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
    
    buildTree(tableUuid) {
        const table = this.getTable(tableUuid);
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
                    data: { tableUuid: tUuid, rowId: rId },
                    children: []
                };
                
                if (parentNode) {
                    parentNode.children.push(node);
                } else {
                    rootNodes.push(node);
                }
                
                const childRefs = this.findChildren(tUuid, rId);
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
    
    deleteRow(tableUuid, rowId, { cascade = true } = {}) {
        const table = this.getTable(tableUuid);
        if (!table) return false;
        if (!table.rows.has(rowId)) return false;
        
        const deleted = [];
        
        if (cascade) {
            const stack = [{ tableUuid, rowId }];
            
            while (stack.length > 0) {
                const { tableUuid: tUuid, rowId: rId } = stack.pop();
                const t = this.getTable(tUuid);
                if (!t || !t.rows.has(rId)) continue;
                
                const children = this.findChildren(tUuid, rId);
                for (const child of children) {
                    stack.push({ tableUuid: child.tableUuid, rowId: child.rowId });
                }
                
                t.deleteRow(rId);
                deleted.push({ tableUuid: tUuid, rowId: rId });
            }
        } else {
            table.deleteRow(rowId);
            deleted.push({ tableUuid, rowId });
        }
        
        return deleted;
    }
    
    _subscribeTable(table) {
        const events = [
            'column-added', 'column-removed', 'column-renamed', 'column-swapped',
            'row-added', 'row-deleted', 'cell-changed'
        ];
        
        for (const eventName of events) {
            table.on(eventName, (data) => {
                this.emit(eventName, data);
            });
        }
    }
    
    toJSON() {
        return {
            tables: Array.from(this.tables.values()).map(table => table.toJSON())
        };
    }
    
    static fromJSON(data) {
        const model = new Model();
        for (const tableData of data.tables) {
            const table = Table.fromJSON(tableData);
            model._subscribeTable(table);
            model.tables.set(table.uuid, table);
        }
        return model;
    }
}

export { Model };
