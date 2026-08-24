import { DomRegistry as DOM } from '../dom-registry.js';
import CellView from '../dom-comps-old/cell-view.js';
import TBS from '../dom-comps-old/top-bottom-static.js';
import Toolbar from '../dom-comps-old/toolbar.js';
import Simple from '../dom-comps-old/simple-view.js';
import { createGridInterface } from '../shared/model2grid.js';

const $$ = DOM.create;


function test(model) {
    const cityTable = Array.from(model.tables.values()).find(t => t.name === 'City');
    const gridIface = createGridInterface(model, cityTable.uuid);
    
    const iCellData1 = gridIface.getCellData(0, "name");
    const cv1 = $$(CellView, iCellData1);
    
    const iCellData2 = gridIface.getCellData(0, "name");
    const cv2 = $$(CellView, iCellData2);

    const tbs = $$(TBS, { ratio: 0.5 })
        .setTop(cv1)
        .setBottom(cv2);

    return tbs;
}

export default test;