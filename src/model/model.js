import { Table } from './table.js';

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
    
    // === Table operations ===
    createTable(name) {
        const uuid = this.generateUuid();
        const table = new Table(uuid, name);
        this.tables.set(uuid, table);
        table.addRow({});  // dummy row
        
        this.emit('table.created', {
            uuid: uuid,
            name: name
        });
        
        return table;
    }
    
    deleteTable(uuid) {
        const table = this.tables.get(uuid);
        if (!table) {
            console.error(`[Model] Table with uuid '${uuid}' not found`);
            return false;
        }
        
        this.tables.delete(uuid);
        
        this.emit('table.deleted', {
            uuid: uuid,
            name: table.name
        });
        
        return true;
    }
    
    renameTable(uuid, newName) {
        const table = this.tables.get(uuid);
        if (!table) {
            console.error(`[Model] Table with uuid '${uuid}' not found`);
            return false;
        }
        
        const oldName = table.name;
        table.name = newName;
        
        this.emit('table.renamed', {
            uuid: uuid,
            oldName: oldName,
            newName: newName
        });
        
        return true;
    }
    
    getTable(uuid) {
        const table = this.tables.get(uuid);
        if (!table) {
            console.error(`[Model] Table with uuid '${uuid}' not found`);
            return null;
        }
        return table;
    }

    getTableNames() {
        
    }
    
    // === Serialization ===
    toJSON() {
        return {
            tables: Array.from(this.tables.values()).map(table => table.toJSON())
        };
    }
    
    static fromJSON(data) {
        const model = new Model();
        for (const tableData of data.tables) {
            const table = Table.fromJSON(tableData);
            model.tables.set(table.uuid, table);
        }
        return model;
    }
}

export { Model };