import { Model } from '../model/model.js';
import { DomRegistry as DOM } from '../dom-registry.js';
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
import ModelView from '../compounds/model-view.js';
import TreeViewTest from '../compounds/tree-view-test.js';
import ModelTreeTest from '../compounds/model-tree-test.js';

const $$ = DOM.create;
const Simple = (title) => $$(SimpleView, { title });

// Load test data
const response = await fetch('./data/test-data-03.json');
const testData = await response.json();
const model = Model.fromJSON(testData);

// compound switcher
const tabView = $$(TabView);

const etbt = ETBT();
const gvt = GVT(model);
const gtt = GridToolbarTest();
const mtt = ModelTreeTest(model);

const lr_gvt_simple = $$(LR, { ratio: 1 }).setLeft(gvt).setRight(Simple('Right'));

const tbs = $$(TBS, {
    topHeight: 32, 
    top: Simple('Top'),
    bottom: Simple('Bottom'),
});

tabView
    .add('TreeView', TreeViewTest(model), { icon: '🌳' })
    .add('ModelTreeTest', mtt, { icon: '🌼' })
    .add('ModelView', ModelView(model), {})
    // .add('../dom-comps/tab-view.js', Simple('Tab 2 Content'), { icon: '🀥' })
    .add('Tab 3', tbs, { icon: '⌛' })
    // .add('GridToolbarTest', gtt, { icon: '🧰' })

DOM.mount(tabView);