import { DomRegistry as DOM } from '../dom-registry.js';
import TreeView from '../dom-comps/tree-view.js';
import TreeItem from '../dom-comps/tree-item.js';
import SimpleView from '../dom-comps/simple-view.js';
import LeftRight from '../dom-comps/left-right.js';
import TopBottom from '../dom-comps/top-bottom.js';

const $$ = DOM.create;

function createListViewTest() {
    const listView = $$(TreeView, { itemClsid: TreeItem });
    
    const fruits = [
        { label: 'Apple', icon: '🍎' },
        { label: 'Banana', icon: '🍌' },
        { label: 'Cherry', icon: '🍒' },
        { label: 'Date', icon: '🌴' },
        { label: 'Elderberry', icon: '🫐' }
    ];
    
    for (const fruit of fruits) {
        listView.add({
            label: fruit.label,
            icon: fruit.icon,
            type: 'leaf'
        });
    }
    
    const Simple = (title) => $$(SimpleView, { title });
    
    const test = $$(LeftRight, {
        left: Simple('Left'),
        right: $$(LeftRight, {
            left: $$(TopBottom, {
                top: Simple('Top'),
                bottom: $$(TopBottom, {
                    top: listView,
                    bottom: Simple('Bottom')
                })
            }),
            right: Simple('Right')
        })
    });
    
    return test;
}

export default createListViewTest;
