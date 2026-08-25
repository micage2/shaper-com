import { DomRegistry as DOM } from '../dom-registry.js';
import PropertyView from '../dom-comps/property-view.js';
import LayoutTest from './layout-test.js';

const $$ = DOM.create;

function createPropertyViewTest() {
    const callbacks = new Set();
    
    const mockRowData = {
        getColumns() {
            return [
                { colId: 'name', name: 'Name', type: 1 },
                { colId: 'age', name: 'Age', type: 2 },
                { colId: 'active', name: 'Active', type: 3 }
            ];
        },
        
        getValue(colId) {
            return {
                name: 'Berlin',
                age: 1237,
                active: true
            }[colId];
        },
        
        setValue(colId, value) {
            console.log(`Set ${colId} = ${value}`);
        },
        
        getLinkInfo() {
            return null;
        },
        
        onValueChanged(callback) {
            callbacks.add(callback);
        }
    };
    
    const propertyView = $$(PropertyView, mockRowData);
    
    return LayoutTest(propertyView);
}

export default createPropertyViewTest;