import { Model } from '../src/model/model.js';
import { createModelInterface } from '../src/model/interface.js';
import * as fs from 'node:fs';


const test_data_file = './data/test-data-01.json';


// Test helper with better error messages
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    try {
        fn();
        testsPassed++;
        console.log(`✓ ${name}`);
    } catch (error) {
        testsFailed++;
        console.error(`✗ ${name}`);
        console.error(`  ${error.message}`);
        if (error.expected !== undefined) {
            console.error(`  Expected: ${JSON.stringify(error.expected)}`);
            console.error(`  Actual:   ${JSON.stringify(error.actual)}`);
        }
    }
}

function expectEqual(actual, expected, message = '') {
    if (actual !== expected) {
        const error = new Error(`${message} - Expected ${expected} but got ${actual}`);
        error.expected = expected;
        error.actual = actual;
        throw error;
    }
}

function expectNotNull(value, message = '') {
    if (value === null || value === undefined) {
        const error = new Error(`${message} - Expected non-null value`);
        error.expected = 'non-null';
        error.actual = value;
        throw error;
    }
}

// Test helper
function createTestModel() {
    const model = new Model();
    const iModel = createModelInterface(model);
    return { model, iModel };
}

// Test 1: Create tables
test('Create tables', () => {
    const { model, iModel } = createTestModel();
    
    const cityTable = iModel.createTable('City');
    const buildingTable = iModel.createTable('Building');
    
    expectEqual(model.tables.size, 2, 'Should have 2 tables');
    expectEqual(cityTable.name, 'City', 'City table name');
    expectEqual(buildingTable.name, 'Building', 'Building table name');
});

// Test 2: Add columns
test('Add columns', () => {
    const { model, iModel } = createTestModel();
    const cityTable = iModel.createTable('City');
    
    cityTable.addColumn('name', 1);        // string
    cityTable.addColumn('population', 2);  // number
    cityTable.addColumn('isCapital', 3);   // boolean
    
    const columns = cityTable.getColumns();
    expectEqual(columns.length, 3, 'Should have 3 columns');
    expectEqual(columns[0].name, 'name', 'First column name');
    expectEqual(columns[1].type, 2, 'Second column type');
});

// Test 3: Add rows with simple types
test('Add rows with simple types', () => {
    const { model, iModel } = createTestModel();
    const cityTable = iModel.createTable('City');
    
    cityTable.addColumn('name', 1);
    cityTable.addColumn('population', 2);
    cityTable.addColumn('isCapital', 3);
    
    const berlinRow = cityTable.addRow({
        name: 'Berlin',
        population: 3645000,
        isCapital: true
    });
    
    expectEqual(berlinRow.getCell('name'), 'Berlin', 'Name should be Berlin');
    expectEqual(berlinRow.getCell('population'), 3645000, 'Population should be 3645000');
    expectEqual(berlinRow.getCell('isCapital'), true, 'isCapital should be true');
    expectEqual(berlinRow.refCount, 1, 'New row should have refCount 1');
    
    // Test default values
    const emptyRow = cityTable.addRow();
    expectEqual(emptyRow.getCell('name'), '', 'Default string should be empty');
    expectEqual(emptyRow.getCell('population'), 0, 'Default number should be 0');
    expectEqual(emptyRow.getCell('isCapital'), false, 'Default boolean should be false');
});

// Test 4: Create links between tables
test('Create links between tables', () => {
    const { model, iModel } = createTestModel();
    
    const cityTable = iModel.createTable('City');
    cityTable.addColumn('name', 1);
    
    const buildingTable = iModel.createTable('Building');
    buildingTable.addColumn('name', 1);
    
    // Add link column
    const cityUuid = cityTable.uuid;
    buildingTable.addColumn('city', 42, cityUuid);
    
    const columns = buildingTable.getColumns();
    expectEqual(columns.length, 2, 'Building should have 2 columns');
    expectEqual(columns[1].type, 42, 'Second column should be link type');
    expectEqual(columns[1].targetTableUuid, cityUuid, 'Link target should be City table');
});

// Test 5: Test refcounting when linking
test('Refcounting when linking', () => {
    const { model, iModel } = createTestModel();
    
    const cityTable = iModel.createTable('City');
    cityTable.addColumn('name', 1);
    
    const buildingTable = iModel.createTable('Building');
    buildingTable.addColumn('name', 1);
    buildingTable.addColumn('city', 42, cityTable.uuid);
    
    const berlinRow = cityTable.addRow({name: 'Berlin'});
    const buildingRow = buildingTable.addRow({
        name: 'Reichstag',
        city: berlinRow.id
    });
    
    // After creation, Berlin should have refCount 2 (1 + linked from building)
    expectEqual(berlinRow.refCount, 2, 'Berlin should have refCount 2');
    expectEqual(buildingRow.refCount, 1, 'Building should have refCount 1');
});

// Test 6: Test deletion with refcounts
test('Deletion with refcounts', () => {
    const { model, iModel } = createTestModel();
    
    const cityTable = iModel.createTable('City');
    cityTable.addColumn('name', 1);
    
    const buildingTable = iModel.createTable('Building');
    buildingTable.addColumn('name', 1);
    buildingTable.addColumn('city', 42, cityTable.uuid);
    
    const berlinRow = cityTable.addRow({name: 'Berlin'});
    const buildingRow = buildingTable.addRow({
        name: 'Reichstag',
        city: berlinRow.id
    });
    
    // Berlin has refCount 2
    expectEqual(berlinRow.refCount, 2, 'Berlin initial refCount');
    
    // Delete building
    buildingRow.delete();
    
    // Berlin should now have refCount 1
    expectEqual(berlinRow.refCount, 1, 'Berlin refCount after building deletion');
    expectNotNull(cityTable.getRow(0), 'Berlin should still exist');
    
    // Delete Berlin
    berlinRow.delete();
    
    // Berlin should be gone
    expectEqual(cityTable.getRow(0), null, 'Berlin should be deleted');
});

// Test 7: Round-trip serialization
test('Round-trip serialization', () => {
    const { model, iModel } = createTestModel();
    
    const cityTable = iModel.createTable('City');
    cityTable.addColumn('name', 1);
    cityTable.addColumn('population', 2);
    
    const buildingTable = iModel.createTable('Building');
    buildingTable.addColumn('name', 1);
    buildingTable.addColumn('city', 42, cityTable.uuid);
    
    cityTable.addRow({name: 'Berlin', population: 3645000});
    buildingTable.addRow({name: 'Reichstag', city: 0});
    
    // Serialize
    const json = model.toJSON();
    const jsonString = JSON.stringify(json, null, 2);
    
    // Deserialize
    const newModel = Model.fromJSON(JSON.parse(jsonString));
    const newIModel = createModelInterface(newModel);
    
    // Check structure
    const newCityTable = newIModel.getTable('City');
    const newBuildingTable = newIModel.getTable('Building');
    
    expectNotNull(newCityTable, 'City table should exist after deserialization');
    expectNotNull(newBuildingTable, 'Building table should exist after deserialization');
    
    const berlinRow = newCityTable.getRow(0);
    expectEqual(berlinRow.getCell('name'), 'Berlin', 'Berlin name after deserialization');
    expectEqual(berlinRow.getCell('population'), 3645000, 'Population after deserialization');
    expectEqual(berlinRow.refCount, 2, 'Berlin refCount should be 2');
    
    const buildingRow = newBuildingTable.getRow(0);
    expectEqual(buildingRow.getCell('name'), 'Reichstag', 'Building name after deserialization');
    expectEqual(buildingRow.getCell('city'), 0, 'City link after deserialization');
});

// Test 8: Event emission
test('Event emission', () => {
    const { model, iModel } = createTestModel();
    
    const events = [];
    iModel.on('table.created', (data) => {
        events.push({event: 'table.created', name: data.name});
    });
    
    iModel.on('row.added', (data) => {
        events.push({event: 'row.added', tableUuid: data.tableUuid});
    });
    
    const cityTable = iModel.createTable('City');
    cityTable.addColumn('name', 1);
    cityTable.addRow({name: 'Berlin'});
    
    expectEqual(events.length, 2, 'Should have 2 events');
    expectEqual(events[0].event, 'table.created', 'First event type');
    expectEqual(events[0].name, 'City', 'First event name');
    expectEqual(events[1].event, 'row.added', 'Second event type');
});

// Test 9: data file round-trip
test('Test 9: data file round-trip', () => {
    // Load test data
    const testData = JSON.parse(fs.readFileSync(test_data_file, 'utf8'));
    
    const model = Model.fromJSON(testData);
    const iModel = createModelInterface(model);
    
    // Verify loaded data
    const cityTable = iModel.getTable('City');
    const buildingTable = iModel.getTable('Building');
    
    expectNotNull(cityTable, 'City table should exist');
    expectNotNull(buildingTable, 'Building table should exist');
    
    const berlinRow = cityTable.getRow(0);
    expectEqual(berlinRow.getCell('name'), 'Berlin', 'Berlin name');
    expectEqual(berlinRow.refCount, 2, 'Berlin refCount should be 2');
    
    const reichstagRow = buildingTable.getRow(0);
    expectEqual(reichstagRow.getCell('city'), 0, 'Reichstag city link');
    
    // Verify link structure
    const buildingColumns = buildingTable.getColumns();
    expectEqual(buildingColumns[1].type, 42, 'Second column should be link');
    expectEqual(buildingColumns[1].targetTableUuid, cityTable.uuid, 'Link target should be City');
    
    // Test operations on loaded data
    reichstagRow.delete();
    expectEqual(berlinRow.refCount, 1, 'Berlin refCount after deletion');
});

// Test 10: Interface pattern - only functions, no data
test('Interface pattern - only functions', () => {
    const { model, iModel } = createTestModel();
    
    const cityTable = iModel.createTable('City');
    
    // Interface should only have functions (except getters)
    const proto = Object.getPrototypeOf(cityTable);
    const propertyNames = Object.getOwnPropertyNames(cityTable);
    
    // Check that the interface object itself has no data properties
    const hasDataProperties = propertyNames.some(prop => {
        const descriptor = Object.getOwnPropertyDescriptor(cityTable, prop);
        return descriptor && 'value' in descriptor && typeof descriptor.value !== 'function';
    });
    
    expectEqual(hasDataProperties, false, 'Interface should not have data properties');
});

// Summary
console.log(`\n${'='.repeat(50)}`);
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed > 0) {
    process.exit(1);
}