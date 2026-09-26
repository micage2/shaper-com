import DB from '../model/db.js';
import { DomRegistry as DOM } from '../dom-registry.js';
import { LoadFile } from '../shared/dom-helper.js';

import SimpleView from '../dom-comps/simple-view.js';
import Button from '../dom-comps/button.js';
import TabHeader from '../dom-comps/tab-header.js';
import TabView from '../dom-comps/tab-view.js';
import LR from '../dom-comps/left-right.js';
import TB from '../dom-comps/top-bottom.js';
import TBS from '../dom-comps/top-bottom-static.js';

import ModelEditor from '../compounds2/model-editor.js';

const $$ = DOM.create;
const Simple = (title) => $$(SimpleView, { title });

// Load test data, TODO
const db = DB(); // database
window.db = db;
const testData = await LoadFile('./data/test-data-03.json');
db.load(testData);

// database is the message hub for modelEditor
const modelEditor = ModelEditor(db);
DOM.mount(modelEditor);

