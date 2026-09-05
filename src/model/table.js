// File: src/model/table.js

import { Column } from './column.js';
import { Row } from './row.js';

class Table {
    constructor(uuid, name) {
        this.uuid = uuid;
        this.name = name;
        this.columns = [];
        this.rows = [];
        this.nextRowId = 0;
        this.eventHandlers = new Map();
    }
    
    // === Events ===
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event).add(handler);
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
    
    // === Helper: find row index by id ===
    findRowIndex(rowId) {
        return this.rows.findIndex(row => row.id === rowId);
    }
    
    // === Column operations ===
    addColumn({name, type, targetTableUuid = null, after = null, before = null}) {
        if (this.columns.find(col => col.name === name)) {
            console.error(`[Table ${this.name}] Column '${name}' already exists`);
            return false;
        }
        
        if (![1, 2, 3, 42].includes(type)) {
            console.error(`[Table ${this.name}] Invalid column type: ${type}`);
            return false;
        }
        
        if (type === 42 && !targetTableUuid) {
            console.error(`[Table ${this.name}] Link column '${name}' requires targetTableUuid`);
            return false;
        }
        
        const column = new Column(name, type, targetTableUuid);
        
        let insertIndex = this.columns.length;
        
        if (after) {
            const afterIndex = this.columns.findIndex(col => col.colId === after || col.name === after);
            if (afterIndex === -1) {
                console.error(`[Table ${this.name}] Column '${after}' not found for 'after'`);
                return false;
            }
            insertIndex = afterIndex + 1;
        } else if (before) {
            const beforeIndex = this.columns.findIndex(col => col.colId === before || col.name === before);
            if (beforeIndex === -1) {
                console.error(`[Table ${this.name}] Column '${before}' not found for 'before'`);
                return false;
            }
            insertIndex = beforeIndex;
        }
        
        this.columns.splice(insertIndex, 0, column);
        
        for (const row of this.rows) {
            row.data[column.colId] = column.defaultValue;
        }
        
        this.emit('column.added', {
            colId: column.colId,
            columnName: column.name,
            type: column.type,
            targetTableUuid: column.targetTableUuid,
            index: insertIndex
        });
        
        return column;
    }
    
    removeColumn(colId) {
        const index = this.columns.findIndex(col => col.colId === colId);
        if (index === -1) {
            console.error(`[Table ${this.name}] Column '${colId}' not found`);
            return false;
        }
        
        const column = this.columns[index];
        this.columns.splice(index, 1);
        
        for (const row of this.rows) {
            delete row.data[colId];
        }
        
        this.emit('column.removed', {
            colId: colId,
            columnName: column.name,
            index: index
        });
        
        return true;
    }
    
    renameColumn(colId, newName) {
        const column = this.columns.find(col => col.colId === colId);
        if (!column) {
            console.error(`[Table ${this.name}] Column '${colId}' not found`);
            return false;
        }
        
        if (this.columns.find(col => col.name === newName)) {
            console.error(`[Table ${this.name}] Column '${newName}' already exists`);
            return false;
        }
        
        const oldName = column.name;
        column.name = newName;
        
        this.emit('column.renamed', {
            colId: colId,
            oldName: oldName,
            newName: newName
        });
        
        return true;
    }
    
    swapColumns(colId1, colId2) {
        const index1 = this.columns.findIndex(col => col.colId === colId1);
        if (index1 === -1) {
            console.error(`[Table ${this.name}] Column '${colId1}' not found`);
            return false;
        }
        
        const index2 = this.columns.findIndex(col => col.colId === colId2);
        if (index2 === -1) {
            console.error(`[Table ${this.name}] Column '${colId2}' not found`);
            return false;
        }
        
        [this.columns[index1], this.columns[index2]] = 
            [this.columns[index2], this.columns[index1]];
        
        this.emit('column.swapped', {
            colId1: colId1,
            colId2: colId2
        });
        
        return true;
    }
    
    // === Row operations ===
    addRow(rowData = {}) {
        const data = {};
        
        for (const column of this.columns) {
            data[column.colId] = column.defaultValue;
        }
        
        for (const [key, value] of Object.entries(rowData)) {
            const column = this.columns.find(col => col.colId === key || col.name === key);
            if (column) {
                data[column.colId] = value;
            }
        }
        
        const row = new Row(this.nextRowId++, data);
        this.rows.push(row);
        
        this.emit('row.added', {
            rowId: row.id,
            rowData: {...row.data}
        });
        
        return row;
    }
    
    deleteRow(rowId) {
        const rowIdx = this.findRowIndex(rowId);
        if (rowIdx === -1) {
            console.error(`[Table ${this.name}] Row with id '${rowId}' not found`);
            return false;
        }
        
        const row = this.rows[rowIdx];
        this.rows.splice(rowIdx, 1);
        
        this.emit('row.deleted', {
            rowId: row.id,
            rowIdx: rowIdx
        });
        
        return true;
    }
    
    getRow(rowId) {
        const rowIdx = this.findRowIndex(rowId);
        if (rowIdx === -1) {
            console.error(`[Table ${this.name}] Row with id '${rowId}' not found`);
            return null;
        }
        return this.rows[rowIdx];
    }
    
    getRowIndex(rowId) {
        return this.findRowIndex(rowId);
    }
    
    setCell(rowId, colId, value) {
        const rowIdx = this.findRowIndex(rowId);
        if (rowIdx === -1) {
            console.error(`[Table ${this.name}] Row with id '${rowId}' not found`);
            return false;
        }
        
        const row = this.rows[rowIdx];
        
        if (!(colId in row.data)) {
            console.error(`[Table ${this.name}] Column '${colId}' not found`);
            return false;
        }
        
        const oldValue = row.data[colId];
        row.data[colId] = value;
        
        const column = this.columns.find(col => col.colId === colId);
        this.emit('cell.changed', {
            rowId: row.id,
            rowIdx: rowIdx,
            colId: colId,
            columnName: column ? column.name : '',
            oldValue: oldValue,
            newValue: value
        });
        
        return true;
    }
    
    getCell(rowId, colId) {
        const rowIdx = this.findRowIndex(rowId);
        if (rowIdx === -1) {
            console.error(`[Table ${this.name}] Row with id '${rowId}' not found`);
            return null;
        }
        
        const row = this.rows[rowIdx];
        
        if (!(colId in row.data)) {
            console.error(`[Table ${this.name}] Column '${colId}' not found`);
            return null;
        }
        
        return row.data[colId];
    }
    
    // === Serialization ===
    toJSON() {
        return {
            uuid: this.uuid,
            name: this.name,
            columns: this.columns.map(col => col.toJSON()),
            rows: this.rows.map(row => row.toJSON())
        };
    }
    
    static fromJSON(data) {
        const table = new Table(data.uuid, data.name);
        table.columns = data.columns.map(col => Column.fromJSON(col));
        table.rows = data.rows.map(row => Row.fromJSON(row));
        table.nextRowId = table.rows.length;
        return table;
    }
}

export { Table };
