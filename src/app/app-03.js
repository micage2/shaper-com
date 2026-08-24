import { DomRegistry as DOM } from '../dom-registry.js';
import SimpleView from '../dom-comps/simple-view.js';
import Button from '../dom-comps/button.js';
import TabView from '../dom-comps/tab-view.js';
import GridView from '../dom-comps/grid-view.js';
import {Model} from '../model/model.js';
import { createGridInterface } from '../shared/model2grid.js';

const $$ = DOM.create;

// Create model with test data
const model = new Model();
const cityTable = model.createTable('City');
cityTable.addColumn({ name: 'name', type: 1 });
cityTable.addColumn({ name: 'population', type: 2 });
cityTable.addColumn({ name: 'isCapital', type: 3 });

cityTable.addRow({ name: 'Berlin', population: 3645000, isCapital: true });
cityTable.addRow({ name: 'Hamburg', population: 1841000, isCapital: false });
cityTable.addRow({ name: 'Munich', population: 1472000, isCapital: false });

// Create grid interface for City table
const gridIface = createGridInterface(model, cityTable.uuid);

// Create GridView
const gridView = $$(GridView, gridIface);

// Create TabView with Button as header item type
const tabView = $$(TabView, {
    headerItemClsid: Button
});

// Add tabs
const content1 = DOM.create(SimpleView, { title: 'Content 1' });
const content2 = DOM.create(SimpleView, { title: 'Content 2' });

tabView
    .add('City Table', gridView)
    .add('Tab 2', content2);

// Mount
DOM.mount(tabView);
