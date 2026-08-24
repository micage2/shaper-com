import { Model } from './model.js';
import { Table } from './table.js';

function createModelInterface(model) {
    return {
        getTable(uuid) {
            const table = model.getTable(uuid);
            if (!table) return null;
            return createTableInterface(table);
        },
        
        getTables() {
            return Array.from(model.tables.values()).map(table => 
                createTableInterface(table)
            );
        },
        
        createTable(name) {
            const table = model.createTable(name);
            return createTableInterface(table);
        },
        
        deleteTable(uuid) {
            return model.deleteTable(uuid);
        },
        
        renameTable(uuid, newName) {
            return model.renameTable(uuid, newName);
        },
        
        on(event, handler) {
            model.on(event, handler);
        },
        
        off(event, handler) {
            model.off(event, handler);
        },
        
        toJSON() {
            return model.toJSON();
        }
    };
}

function createTableInterface(table) {
    return {
        get uuid() {
            return table.uuid;
        },
        
        get name() {
            return table.name;
        },
        
        addColumn(spec) {
            return table.addColumn(spec);
        },
        
        removeColumn(colId) {
            return table.removeColumn(colId);
        },
        
        renameColumn(colId, newName) {
            return table.renameColumn(colId, newName);
        },
        
        swapColumns(colId1, colId2) {
            return table.swapColumns(colId1, colId2);
        },
        
        getColumns() {
            return table.columns.map(col => ({
                colId: col.colId,
                name: col.name,
                type: col.type,
                targetTableUuid: col.targetTableUuid
            }));
        },
        
        addRow(rowData = {}) {
            const row = table.addRow(rowData);
            return createRowInterface(table, row);
        },
        
        getRow(rowIdx) {
            const row = table.getRow(rowIdx);
            if (!row) return null;
            return createRowInterface(table, row);
        },
        
        getRows() {
            return table.rows.map(row => createRowInterface(table, row));
        },
        
        deleteRow(rowIdx) {
            return table.deleteRow(rowIdx);
        },
        
        on(event, handler) {
            table.on(event, handler);
        },
        
        off(event, handler) {
            table.off(event, handler);
        }
    };
}

function createRowInterface(table, row) {
    return {
        get id() {
            return row.id;
        },
        
        get refCount() {
            return row.refCount;
        },
        
        getCell(colIdOrName) {
            const column = table.columns.find(col => col.colId === colIdOrName || col.name === colIdOrName);
            if (!column) return null;
            return row.data[column.colId];
        },
        
        setCell(colIdOrName, value) {
            const column = table.columns.find(col => col.colId === colIdOrName || col.name === colIdOrName);
            if (!column) return false;
            const rowIdx = table.rows.indexOf(row);
            return table.setCell(rowIdx, column.colId, value);
        },
        
        update(changes) {
            for (const [key, value] of Object.entries(changes)) {
                const column = table.columns.find(col => col.colId === key || col.name === key);
                if (column) {
                    row.data[column.colId] = value;
                }
            }
            return true;
        },
        
        delete() {
            const rowIdx = table.rows.indexOf(row);
            return table.deleteRow(rowIdx);
        },
        
        incRef() {
            row.incRef();
        },
        
        decRef() {
            row.decRef();
        },
        
        getData() {
            const result = {};
            for (const [colId, value] of Object.entries(row.data)) {
                const column = table.columns.find(col => col.colId === colId);
                if (column) {
                    result[column.name] = value;
                }
            }
            return result;
        }
    };
}

export { createModelInterface, createTableInterface, createRowInterface };