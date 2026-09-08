// Row/Instance - holds actual data
export class Row {
    constructor(id, data) {
        this.id = id;
        this.data = data;
    }
    
    toJSON() {
        return {
            id: this.id,
            data: this.data,
        };
    }
    
    static fromJSON(data) {
        return new Row(data.id, data.data);
    }
}
