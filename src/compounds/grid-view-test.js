import { DomRegistry as DOM } from '../dom-registry.js';
import GridView from '../dom-comps/grid-view.js';
import SelectBox from '../dom-comps/select-box.js';
import Toolbar from '../dom-comps/toolbar.js';
import TBS from '../dom-comps/top-bottom-static.js';

function GridViewTest(model) {
    if (!model) {
        console.error('[GridViewTest] Model is required');
        return null;
    }
    
    const mainTBS = DOM.create(TBS, { topHeight: 40 });
    const mainToolbar = DOM.create(Toolbar, {});
    
    // Table selector
    const tableOptions = Array.from(model.tables.values()).map(t => ({
        value: t.uuid,
        label: t.name
    }));
    
    const tableSelect = DOM.create(SelectBox, { options: tableOptions });
    
    let currentGridView = null;
    
    function showTable(tableUuid) {
        if (!tableUuid) return;
        
        const gridView = DOM.create(GridView, {
            model: model,
            tableUuid: tableUuid
        });
        
        if (gridView) {
            currentGridView = gridView;
            mainTBS.setBottom(gridView);
        }
    }
    
    tableSelect.on('changed', function(msg) {
        showTable(msg.value);
    });
    
    mainToolbar.add(tableSelect);
    mainTBS.setTop(mainToolbar);
    
    // Initial table
    const tables = Array.from(model.tables.values());
    if (tables.length > 0) {
        tableSelect.setValue(tables[0].uuid);
        showTable(tables[0].uuid);
    }
    
    return mainTBS;
}

export default GridViewTest;
