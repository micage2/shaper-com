import { DomRegistry as DOM } from '../dom-registry.js';
import SimpleView from '../dom-comps/simple-view.js';
import Button from '../dom-comps/button.js';
import TabView from '../dom-comps/tab-view.js';

const $$ = DOM.create;

// Create TabView with Button as header item type
const tabView = $$(TabView, {
    headerItemClsid: Button
});

// Add tabs
const content1 = DOM.create(SimpleView, { title: 'Content 1' });
const content2 = DOM.create(SimpleView, { title: 'Content 2' });

tabView
    .add('Tab 1', content1)
    .add('Tab 2', content2);

// Mount
DOM.mount(tabView);
