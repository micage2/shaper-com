// Row/Instance - holds actual data
export class Row {
    constructor(id, data, refCount = 0) {
        this.id = id;
        this.data = data;
        this.refCount = refCount;
    }
    
    incRef() {
        this.refCount++;
    }
    
    decRef() {
        this.refCount--;
    }
    
    toJSON() {
        return {
            id: this.id,
            data: this.data,
            refCount: this.refCount
        };
    }
    
    static fromJSON(data) {
        return new Row(data.id, data.data, data.refCount);
    }
}

