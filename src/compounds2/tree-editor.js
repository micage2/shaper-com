import { DomRegistry as DOM } from '../dom-registry.js';

import TBS from '../dom-comps/top-bottom-static.js';
import LR from '../dom-comps/left-right.js';
import TwoStateBox from '../dom-comps/two-state-box.js';
import TreeView from '../dom-comps/tree-view.js';
import TreeItem from '../dom-comps/tree-item.js';
import PropertyView from '../dom-comps/property-view.js';

export default function TreeEditor(iface) {
    const layout = DOM.create(TBS, { topHeight: 40 });
    const toggleBar = DOM.create(TwoStateBox, {});
    const mainLR = DOM.create(LR, {});
    const treeView = DOM.create(TreeView, { itemClsid: TreeItem });
    const propView = DOM.create(PropertyView, { caption: '—' });
    
    mainLR.setLeft(treeView);
    mainLR.setRight(propView);
    
    layout.setTop(toggleBar);
    layout.setBottom(mainLR);
    
    return layout;
}