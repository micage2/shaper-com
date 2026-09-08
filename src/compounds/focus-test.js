// src/compounds/focus-test.js

import { DomRegistry as DOM } from '../dom-registry.js';
import TBS from '../dom-comps/top-bottom-static.js';
import Toolbar from '../dom-comps/toolbar.js';
import TextInput from '../dom-comps/text-input.js';
import Button from '../dom-comps/button.js';
import EditToggleBox from '../dom-comps/edit-toggle-box_focus-out.js';

function TestDialog() {
    const toolbar = DOM.create(Toolbar, {});
    const input = DOM.create(TextInput, { value: '', placeholder: 'Type something' });
    const confirm = DOM.create(Button, { label: '✓' });
    const cancel = DOM.create(Button, { label: '✗' });
    
    toolbar.add(input);
    toolbar.add(confirm);
    toolbar.add(cancel);
    
    return toolbar;
}

function IdleButton(label) {
    const button = DOM.create(Button, { label });
    button.on('clicked', function() {
        this.emit('close');
    });
    return button;
}

export default function FocusTest() {
    const mainTBS = DOM.create(TBS, { topHeight: 40 });
    // const mainToolbar = DOM.create(Toolbar, {});
    const editToggleBox = DOM.create(EditToggleBox, {});
    
    editToggleBox.add('test-toggle', 'center',
        IdleButton('Edit'),
        TestDialog());
    
    // mainToolbar.add(editToggleBox);
    mainTBS.setTop(editToggleBox);
    
    return mainTBS;
}
