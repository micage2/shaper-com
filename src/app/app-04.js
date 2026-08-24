import { DomRegistry as DOM } from '../dom-registry.js';
import Button from '../dom-comps-old/button.js';
import TabView from '../dom-comps-old/tab-view.js';
import { Model } from '../model/model.js';
import { createEditToggleTest } from './edit-toggle-test.js';
import { createGridViewTest } from './grid-view-test.js';
import CellViews from '../compounds/cell-views.js';

const $$ = DOM.create;

// Load test data
const response = await fetch('./data/test-data-03.json');
const testData = await response.json();
const model = Model.fromJSON(testData);

const tabView = $$(TabView, {
    headerItemClsid: Button
});

tabView
    .add('CellViews', CellViews(model))
    .add('GridView', createGridViewTest(model));

DOM.mount(tabView);