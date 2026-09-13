import { Column } from './column.js';
import { Row } from './row.js';

class Table {
    constructor(uuid, name) {
        this.uuid = uuid;
        this.name = name;
        this.columns = new Map();
        this.rows = new Map();
        this.nextRowId = 0;
        this.eventHandlers = new Map();
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
    
    forColumns(callback) {
        for (const col of this.columns.values()) {
            if (callback(col, this)) return col;
        }
        return null;
    }
    
    forRows(callback) {
        for (const row of this.rows.values()) {
            if (callback(row, this)) return row;
        }
        return null;
    }
    
    removeColumn(colId) {
        const column = this.columns.get(colId);
        if (!column) {
            console.error(`[Table ${this.name}] Column '${colId}' not found`);
            return false;
        }
        
        this.columns.delete(colId);
        
        for (const row of this.rows.values()) {
            delete row.data[colId];
        }
        
        this.emit('column-removed', {
            tableUuid: this.uuid,
            colId: colId,
            columnName: column.name
        });
        
        return true;
    }
    
    renameColumn(colId, newName) {
        const column = this.columns.get(colId);
        if (!column) {
            console.error(`[Table ${this.name}] Column '${colId}' not found`);
            return false;
        }
        
        for (const col of this.columns.values()) {
            if (col.name === newName) {
                console.error(`[Table ${this.name}] Column '${newName}' already exists`);
                return false;
            }
        }
        
        const oldName = column.name;
        column.name = newName;
        
        this.emit('column-renamed', {
            tableUuid: this.uuid,
            colId: colId,
            oldName: oldName,
            newName: newName
        });
        
        return true;
    }
    
    swapColumns(colId1, colId2) {
        if (!this.columns.has(colId1) || !this.columns.has(colId2)) return false;
        
        const entries = Array.from(this.columns.entries());
        const idx1 = entries.findIndex(([id]) => id === colId1);
        const idx2 = entries.findIndex(([id]) => id === colId2);
        
        [entries[idx1], entries[idx2]] = [entries[idx2], entries[idx1]];
        
        this.columns = new Map(entries);
        
        this.emit('column-swapped', {
            tableUuid: this.uuid,
            colId1: colId1,
            colId2: colId2
        });
        
        return true;
    }
    
    addRow(rowData = {}) {
        const data = {};
        
        for (const column of this.columns.values()) {
            data[column.colId] = column.defaultValue;
        }
        
        for (const [key, value] of Object.entries(rowData)) {
            for (const column of this.columns.values()) {
                if (column.colId === key || column.name === key) {
                    data[column.colId] = value;
                }
            }
        }
        
        const row = new Row(this.nextRowId++, data);
        this.rows.set(row.id, row);
        
        this.emit('row-added', {
            tableUuid: this.uuid,
            rowId: row.id,
            rowData: { ...row.data }
        });
        
        return row;
    }
    
    deleteRow(rowId) {
        if (this.rows.has(rowId)) {
            this.rows.delete(rowId);
            this.emit('row-deleted', {
                tableUuid: this.uuid,
                rowId: rowId
            });
        }
    }
    
    getRow(rowId) {
        const row = this.rows.get(rowId);
        if (!row) {
            console.error(`[Table ${this.name}] Row '${rowId}' not found`);
            return null;
        }
        return row;
    }
    
    setCell(rowId, colId, value) {
        const row = this.rows.get(rowId);
        if (!row) {
            console.error(`[Table ${this.name}] Row '${rowId}' not found`);
            return false;
        }
        
        if (!(colId in row.data)) {
            console.error(`[Table ${this.name}] Column '${colId}' not found`);
            return false;
        }
        
        const oldValue = row.data[colId];
        row.data[colId] = value;
        
        const column = this.columns.get(colId);
        this.emit('cell-changed', {
            tableUuid: this.uuid,
            rowId: rowId,
            colId: colId,
            columnName: column ? column.name : '',
            oldValue: oldValue,
            newValue: value
        });
        
        return true;
    }
    
    getCell(rowId, colId) {
        const row = this.rows.get(rowId);
        if (!row) {
            console.error(`[Table ${this.name}] Row '${rowId}' not found`);
            return null;
        }
        
        if (!(colId in row.data)) {
            console.error(`[Table ${this.name}] Column '${colId}' not found`);
            return null;
        }
        
        return row.data[colId];
    }
    
    toJSON() {
        return {
            uuid: this.uuid,
            name: this.name,
            columns: Array.from(this.columns.values()).map(col => col.toJSON()),
            rows: Array.from(this.rows.values()).map(row => row.toJSON())
        };
    }
    
    static fromJSON(data) {
        const table = new Table(data.uuid, data.name);
        
        for (const colData of data.columns) {
            const column = Column.fromJSON(colData);
            table.columns.set(column.colId, column);
        }
        
        for (const rowData of data.rows) {
            const row = Row.fromJSON(rowData);
            table.rows.set(row.id, row);
        }
        
        if (table.rows.size > 0) {
            const maxId = Math.max(...Array.from(table.rows.keys()));
            table.nextRowId = maxId + 1;
        }
        
        return table;
    }
}

export { Table };
