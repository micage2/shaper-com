class Column {
    constructor(name, type, targetTableUuid = null) {
        this.colId = Column.generateId();
        this.name = name;
        this.type = type;
        this.targetTableUuid = targetTableUuid;
        this.defaultValue = this.getDefaultValue();
    }
    
    static generateId() {
        return Math.random().toString(36).substr(2, 8);
    }
    
    getDefaultValue() {
        switch(this.type) {
            case 1: return "";
            case 2: return 0;
            case 3: return false;
            case 42: return null;
            default: throw new Error(`Unknown type: ${this.type}`);
        }
    }
    
    isLink() {
        return this.type === 42;
    }
    
    toJSON() {
        return {
            colId: this.colId,
            name: this.name,
            type: this.type,
            ...(this.targetTableUuid ? {targetTableUuid: this.targetTableUuid} : {})
        };
    }
    
    static fromJSON(data) {
        const column = new Column(data.name, data.type, data.targetTableUuid);
        column.colId = data.colId || Column.generateId();
        return column;
    }
}

export { Column };