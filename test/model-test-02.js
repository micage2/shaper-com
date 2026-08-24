import { Model } from '../src/model/model.js';
import { createModelInterface } from '../src/model/interface.js';
import * as fs from 'node:fs';

// Test helper
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    try {
        fn();
        testsPassed++;
        console.log(`✓ ${name}`);
    } catch (error) {
        testsFailed++;
        console.log(`✗ ${name}`);
        console.log(`  ${error.message}`);
    }
}

function expectEqual(actual, expected, message = '') {
    if (actual !== expected) {
        throw new Error(`${message} - Expected ${expected} but got ${actual}`);
    }
}

function expectNotNull(value, message = '') {
    if (value === null || value === undefined) {
        throw new Error(`${message} - Expected non-null value`);
    }
}

function createTestModel() {
    const model = new Model();
    const iModel = createModelInterface(model);
    return { model, iModel };
}

// Test 1: Create tables
test('Test 1: Create tables', () => {
    const { model, iModel } = createTestModel();
    
    const cityTable = iModel.createTable('City');
    const buildingTable = iModel.createTable('Building');
    
    expectEqual(model.tables.size, 2, 'Should have 2 tables');
    expectEqual(cityTable.name, 'City', 'City table name');
    expectEqual(buildingTable.name, 'Building', 'Building table name');
});

// Test 2: Add columns
test('Test 2: Add columns', () => {
    const { model, iModel } = createTestModel();
    const cityTable = iModel.createTable('City');
    
    cityTable.addColumn({ name: 'name', type: 1 });
    cityTable.addColumn({ name: 'population', type: 2 });
    cityTable.addColumn({ name: 'isCapital', type: 3 });
    
    const columns = cityTable.getColumns();
    expectEqual(columns.length, 3, 'Should have 3 columns');
    expectEqual(columns[0].name, 'name', 'First column name');
    expectEqual(columns[1].type, 2, 'Second column type');
});

// Test 3: Add rows with simple types
test('Test 3: Add rows with simple types', () => {
    const { model, iModel } = createTestModel();
    const cityTable = iModel.createTable('City');
    
    cityTable.addColumn({ name: 'name', type: 1 });
    cityTable.addColumn({ name: 'population', type: 2 });
    cityTable.addColumn({ name: 'isCapital', type: 3 });
    
    const berlinRow = cityTable.addRow({
        name: 'Berlin',
        population: 3645000,
        isCapital: true
    });
    
    expectEqual(berlinRow.getCell('name'), 'Berlin', 'Name should be Berlin');
    expectEqual(berlinRow.getCell('population'), 3645000, 'Population should be 3645000');
    expectEqual(berlinRow.getCell('isCapital'), true, 'isCapital should be true');
    
    // Test default values
    const emptyRow = cityTable.addRow();
    expectEqual(emptyRow.getCell('name'), '', 'Default string should be empty');
    expectEqual(emptyRow.getCell('population'), 0, 'Default number should be 0');
    expectEqual(emptyRow.getCell('isCapital'), false, 'Default boolean should be false');
});

// Test 4: Column positioning
test('Test 4: Column positioning', () => {
    const { model, iModel } = createTestModel();
    const cityTable = iModel.createTable('City');
    
    cityTable.addColumn({ name: 'name', type: 1 });
    cityTable.addColumn({ name: 'population', type: 2 });
    
    // Insert before existing column
    cityTable.addColumn({ name: 'country', type: 1, before: 'name' });
    
    let columns = cityTable.getColumns();
    expectEqual(columns[0].name, 'country', 'Inserted before should be first');
    
    // Insert after existing column
    cityTable.addColumn({ name: 'mayor', type: 1, after: 'name' });
    
    columns = cityTable.getColumns();
    expectEqual(columns[1].name, 'name', 'Name should still be second');
    expectEqual(columns[2].name, 'mayor', 'Mayor should be after name');
});

// Test 5: Swap columns
test('Test 5: Swap columns', () => {
    const { model, iModel } = createTestModel();
    const cityTable = iModel.createTable('City');
    
    cityTable.addColumn({ name: 'a', type: 1 });
    cityTable.addColumn({ name: 'b', type: 1 });
    cityTable.addColumn({ name: 'c', type: 1 });
    cityTable.addColumn({ name: 'd', type: 2 });
    
    // Swap a and c
    cityTable.swapColumns('a', 'c');
    
    let columns = cityTable.getColumns();
    expectEqual(columns[0].name, 'c', 'C should be first');
    expectEqual(columns[2].name, 'a', 'A should be third');
    
    // Swap back
    cityTable.swapColumns('c', 'a');
    
    columns = cityTable.getColumns();
    expectEqual(columns[0].name, 'a', 'A should be first');
    expectEqual(columns[2].name, 'c', 'C should be third');
});

// Test 6: Rename column
test('Test 6: Rename column', () => {
    const { model, iModel } = createTestModel();
    const cityTable = iModel.createTable('City');
    
    cityTable.addColumn({ name: 'name', type: 1 });
    cityTable.addRow({ name: 'Berlin' });
    
    cityTable.renameColumn('name', 'cityName');
    
    const columns = cityTable.getColumns();
    expectEqual(columns[0].name, 'cityName', 'Column should be renamed');
    
    const row = cityTable.getRow(0);
    expectEqual(row.getCell('cityName'), 'Berlin', 'Row data should follow rename');
});

// Test 7: Remove column
test('Test 7: Remove column', () => {
    const { model, iModel } = createTestModel();
    const cityTable = iModel.createTable('City');
    
    cityTable.addColumn({ name: 'name', type: 1 });
    cityTable.addColumn({ name: 'population', type: 2 });
    cityTable.addRow({ name: 'Berlin', population: 3645000 });
    
    cityTable.removeColumn('population');
    
    const columns = cityTable.getColumns();
    expectEqual(columns.length, 1, 'Should have 1 column');
    expectEqual(columns[0].name, 'name', 'Only name should remain');
});

// Test 7b: Table events
test('Test 7b: Table events', () => {
    const { model, iModel } = createTestModel();
    const cityTable = iModel.createTable('City');
    
    const events = [];
    
    cityTable.on('column.added', (data) => {
        events.push({ event: 'column.added', ...data });
    });
    
    cityTable.on('row.added', (data) => {
        events.push({ event: 'row.added', ...data });
    });
    
    cityTable.on('cell.changed', (data) => {
        events.push({ event: 'cell.changed', ...data });
    });
    
    cityTable.addColumn({ name: 'name', type: 1 });
    const row = cityTable.addRow({ name: 'Berlin' });
    row.setCell('name', 'Hamburg');
    
    expectEqual(events.length, 3, 'Should have 3 events');
    expectEqual(events[0].event, 'column.added', 'First event');
    expectEqual(events[1].event, 'row.added', 'Second event');
    expectEqual(events[2].event, 'cell.changed', 'Third event');
    expectEqual(events[2].oldValue, 'Berlin', 'Old value in cell changed');
    expectEqual(events[2].newValue, 'Hamburg', 'New value in cell changed');
});

// Test 8: Round-trip serialization
// Test 8: Round-trip serialization
test('Test 8: Round-trip serialization', () => {
    const test_data_file = './data/test-data-01.json';
    const modified_file = './data/test-data-01-mod.json';
    
    // 1. Read file
    const testData = JSON.parse(fs.readFileSync(test_data_file, 'utf8'));
    const model = Model.fromJSON(testData);
    const iModel = createModelInterface(model);
    
    // Find City table
    const tables = iModel.getTables();
    const cityTable = tables.find((table) => table.name === 'City');
    expectNotNull(cityTable, 'City table should exist');
    
    // 2. Make changes
    cityTable.addRow({ name: 'Munich', population: 1472000, isCapital: false });
    cityTable.renameColumn('population', 'inhabitants');
    const berlinRow = cityTable.getRow(0);
    berlinRow.setCell('name', 'Berlin (updated)');
    
    // 3. Save to modified file
    const jsonString = JSON.stringify(model.toJSON(), null, 2);
    fs.writeFileSync(modified_file, jsonString);
    
    // 4. Read modified file again
    const reloadedData = JSON.parse(fs.readFileSync(modified_file, 'utf8'));
    const reloadedModel = Model.fromJSON(reloadedData);
    const reloadedIModel = createModelInterface(reloadedModel);
    
    const reloadedTables = reloadedIModel.getTables();
    const reloadedCityTable = reloadedTables.find((table) => table.name === 'City');
    
    // Check changes survived
    const reloadedBerlinRow = reloadedCityTable.getRow(0);
    expectEqual(reloadedBerlinRow.getCell('name'), 'Berlin (updated)', 'Updated name survived');
    
    const reloadedColumns = reloadedCityTable.getColumns();
    expectEqual(reloadedColumns[1].name, 'inhabitants', 'Renamed column survived');
    
    const reloadedRowCount = reloadedCityTable.getRows().length;
    expectEqual(reloadedRowCount, 3, 'Added row survived');
});

// Test 9: Test data file
test('Test 9: Test data file', () => {
    const test_data_file = './data/test-data-01.json';
    const testData = JSON.parse(fs.readFileSync(test_data_file, 'utf8'));
    
    const model = Model.fromJSON(testData);
    const iModel = createModelInterface(model);

    const tables = iModel.getTables();
    const cityTable = tables.find((table) => table.name === 'City');
    const buildingTable = tables.find((table) => table.name === 'Building');
    
    expectNotNull(cityTable, 'City table should exist');
    expectNotNull(buildingTable, 'Building table should exist');
    
    const berlinRow = cityTable.getRow(0);
    expectEqual(berlinRow.getCell('name'), 'Berlin', 'Berlin name');
});

// Summary
console.log(`\n${'='.repeat(50)}`);
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);

if (testsFailed > 0) {
    process.exit(1);
}