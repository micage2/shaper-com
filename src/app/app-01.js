import { DomRegistry as DOM } from '../dom-registry.js';
import SimpleView from '../dom-comps/simple-view.js';
import LeftRight from '../dom-comps/left-right.js';
import TopBottomStatic from '../dom-comps/top-bottom-static.js';
import Toolbar from '../dom-comps/toolbar.js';
import Button from '../dom-comps/button.js';

const $$ = DOM.create;

const toolbar = $$(Toolbar)
    .add({ clsid: Button, name: 'btn-new', label: 'New' })
    .add({ clsid: Button, name: 'btn-open', label: 'Open' })
    .add({ clsid: Button, name: 'btn-save', label: 'Save', onClick: () =>{
        console.log('ok');        
    }});

const leftRight = $$(LeftRight, { ratio: 0.3 })
    .setLeft($$(SimpleView, { title: 'Left Panel' }))
    .setRight($$(SimpleView, { title: 'Right Panel' }));

const app = $$(TopBottomStatic, { ratio: 0.1 })
    .setTop(toolbar)
    .setBottom(leftRight);

DOM.mount(app);