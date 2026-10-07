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
import "../_project-root.js";

import ModelEditor from '../compounds2/model-editor.js';

const $$ = DOM.create;

console.log('⚙️', '[App]', 'check light mode!');

// Load test data, TODO
const db = DB(); // database
// @ts-ignore
window.db = db;

window.addEventListener('error', (event) => {
    event.preventDefault();
    // @ts-ignore
    const projectRoot = window.__ROOT__ || '';
    const path = projectRoot
        ? event.filename.replace(/^https?:\/\/localhost:5500/, projectRoot)
        : event.filename;

    console.groupCollapsed(`❌ ${event.message} (${path}:${event.lineno})`);
    const stack = (event.error?.stack || '').replace(/(https?:\/\/localhost:5500)/g, projectRoot);
    console.log(stack);
    console.groupEnd();
    debugger;
});

window.addEventListener('_error', (e) => {
    e.preventDefault();
    // @ts-ignore
    const err = e.error;
    if (!err?.stack) return;

    const firstLine = err.stack.split('\n')[1] || '';
    const regex = /\(?((?:https?|file):\/\/[^):\s]+):(\d+):(\d+)\)?\s*$/;
    const m = firstLine.match(regex);
    if (!m) return console.error(err.stack);

    const [, url, line, col] = m;
    console.error(new Error(err.message), { origin: err.stack });
});

// Unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault(); // ← suppresses the default "Uncaught (in promise)" output
    console.error(`❌ Unhandled: ${event.reason?.message ?? event.reason}`);
});

// const testData = await LoadFile('./data/test-data-03.json');
// db.load(testData);

// database is the message hub for modelEditor
const modelEditor = ModelEditor(db);
DOM.mount(modelEditor);

