import { Model } from '../model/model.js';
import { DomRegistry as DOM } from '../dom-registry.js';
import { LoadFile } from '../shared/dom-helper.js';

import SimpleView from '../dom-comps/simple-view.js';
import Button from '../dom-comps/button.js';
import TabHeader from '../dom-comps/tab-header.js';
import TabView from '../dom-comps/tab-view.js';
import LR from '../dom-comps/left-right.js';
import TB from '../dom-comps/top-bottom.js';
import TBS from '../dom-comps/top-bottom-static.js';
import ETBT from '../compounds/edit-toggle-box-test.js';
import GVT from '../compounds/grid-view-test.js';
import GridToolbarTest from '../compounds/grid-toolbar-test.js';
import TreeViewTest from '../compounds/tree-view-test.js';
import ListViewTest from '../compounds/list-view-test.js';
import LayoutTest from '../compounds/layout-test.js';
import PropertyViewTest from '../compounds/property-view-test.js';
import EditToggleNew from '../compounds/edit-toggle-box-new-test.js';
import ModelTreeTest from '../compounds/model-tree-test.js';
import ModelViewTest from '../compounds/model-view-test.js';
import ModelTreeEditor from '../compounds/model-tree-editor-5.js';

const $$ = DOM.create;
const Simple = (title) => $$(SimpleView, { title });

// Load test data
const testData = await LoadFile('./data/test-data-03.json');
const model = testData ? Model.fromJSON(testData) : new Model();
window.mmm = model; // debugging only

// compound switcher
const tabView = $$(TabView);

// test compound factory for tabs
const tbs = (title) => $$(TBS, {
    topHeight: 32, 
    top: Simple('Top'),
    bottom: Simple(title),
});

tabView
    .add('ModelTreeEditor', ModelTreeEditor(model), { icon: '📋' })
    .add('TreeView', TreeViewTest(model), { icon: '🌳' })
    // .add('ModelTableEditor', ModelViewTest(model, true), {})
    .add('Tab 3', tbs('Nothing to see here.'), { icon: '⌛' })
    .add('Tab 4', tbs('Nothing to see here either.'), { icon: '🌼' })

DOM.mount(tabView);

