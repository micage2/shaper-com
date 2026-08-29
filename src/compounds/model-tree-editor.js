import { DomRegistry as DOM } from '../dom-registry.js';
import TreeView from '../dom-comps/tree-view.js';
import PropertyView from '../dom-comps/property-view.js';
import TreeItem from '../dom-comps/tree-item.js';
import SelectBox from '../dom-comps/select-box.js';
import EditToggle from '../dom-comps/edit-toggle.js';
import EditToggleBox from '../dom-comps/edit-toggle-box.js';
import Button from '../dom-comps/button.js';
import TopBottom from '../dom-comps/top-bottom.js';
import TopBottomStatic from '../dom-comps/top-bottom-static.js';
import { Mediator } from '../shared/mediator.js';
import { createTreeInterface } from '../shared/model2tree.js';
import { createRowDataInterface } from '../shared/model2row.js';

const $$ = DOM.create;
const Tree = (iTreeData) => $$(TreeView, iTreeData);
const Props = (iPropertyData) => $$(PropertyView, iPropertyData);

function createModelTreeEditor(model, config = {}) {
    const treeIface = createTreeInterface(model, config);
    const hub = new Mediator();
    
    let mainLayout = null;
    let toolbar = null;
    let treeView = null;
    let propsView = null;
    let top_bottom = null;
    let currentSelection = null;
    let currentRootUuid = config.rootTableUuid || Array.from(model.tables.values())[0].uuid;
    
    function refreshProps() {
        if (propsView) DOM.detach(propsView);
        
        propsView = $$(PropertyView, {});
        
        const tableUuid = currentSelection ? currentSelection.tableUuid : currentRootUuid;
        const table = model.getTable(tableUuid);
        if (!table) {
            top_bottom.setBottom(propsView);
            return;
        }
        
        const rowData = currentSelection 
            ? createRowDataInterface(model, currentSelection.tableUuid, currentSelection.rowId)
            : null;
        
        for (const column of table.columns) {
            const value = rowData ? rowData.getValue(column.colId) : column.defaultValue;
            
            if (column.type === 1) {
                propsView.addString(column.name, value);
            } else if (column.type === 2) {
                propsView.addNumber(column.name, value);
            } else if (column.type === 3) {
                propsView.addBoolean(column.name, value);
            } else if (column.type === 42) {
                const options = rowData ? rowData.getLinkInfo(column.colId) : [];
                propsView.addLink(column.name, options, value);
            }
        }
        
        if (rowData) {
            propsView.on('value-changed', (data) => {
                const col = table.columns.find(c => c.name === data.name);
                if (col) {
                    table.setCell(currentSelection.rowId, col.colId, data.value);
                }
            });
        }
        
        DOM.attach(propsView, top_bottom, { slot: 'bottom' });
    }
    
    hub.on('selection-changed', (item) => {
        currentSelection = item.getData();
        refreshProps();
    });
    
    hub.on('instance-added', () => {
        rebuildTree();
        refreshProps();
    });
    
    hub.on('instance-deleted', () => {
        currentSelection = null;
        rebuildTree();
        refreshProps();
    });
    
    hub.on('property-added', () => {
        refreshProps();
    });
    
    hub.on('property-deleted', () => {
        refreshProps();
    });
    
    hub.on('type-added', (tableUuid) => {
        currentSelection = null;
        currentRootUuid = tableUuid;
        rebuildTree();
        rebuildToolbar(tableUuid);
        refreshProps();
    });
    
    hub.on('type-renamed', (tableUuid) => {
        rebuildToolbar(tableUuid);
        rebuildTree();
    });
    
    hub.on('type-deleted', (tableUuid) => {
        currentSelection = null;
        const remaining = Array.from(model.tables.values());
        if (remaining.length > 0) {
            currentRootUuid = remaining[0].uuid;
            rebuildTree();
            rebuildToolbar(currentRootUuid);
            refreshProps();
        }
    });
    
    function buildToolbar(tableUuid) {
        const box = $$(EditToggleBox);
        
        const tableSelect = $$(SelectBox, {
            options: Array.from(model.tables.values()).map(t => ({ value: t.uuid, label: t.name })),
            value: tableUuid,
            onChange: (uuid) => {
                currentRootUuid = uuid;
                currentSelection = null;
                rebuildTree();
                refreshProps();
            }
        });
        
        const addTypeToggle = $$(EditToggle, {
            idleLabel: '+ Type',
            editLabel: 'Add Type',
            editChildren: [
                { type: 'input', name: 'name', placeholder: 'type name' },
                { type: 'button', label: 'Ok', action: 'ok' },
                { type: 'button', label: 'Cancel', action: 'cancel' }
            ],
            onfinish: (confirmed, values) => {
                if (confirmed && values.name) {
                    const table = model.createTable(values.name);
                    hub.emit('type-added', table.uuid);
                }
            }
        });
        
        const renameToggle = $$(EditToggle, {
            idleLabel: 'Rename',
            editLabel: 'Rename Type',
            editChildren: [
                { 
                    type: 'input', 
                    name: 'name',
                    value: model.getTable(tableUuid)?.name || ''
                },
                { type: 'button', label: 'Ok', action: 'ok' },
                { type: 'button', label: 'Cancel', action: 'cancel' }
            ],
            onfinish: (confirmed, values) => {
                if (confirmed && values.name) {
                    model.renameTable(tableUuid, values.name);
                    hub.emit('type-renamed', tableUuid);
                }
            }
        });
        
        const deleteTypeBtn = $$(Button, {
            label: '🗑',
            onClick: () => {
                model.deleteTable(tableUuid);
                hub.emit('type-deleted', tableUuid);
            }
        });
        
        const addInstanceToggle = $$(EditToggle, {
            idleLabel: '+ Instance',
            editLabel: 'Add Instance',
            editChildren: [
                { type: 'input', name: 'name', placeholder: 'instance name' },
                { type: 'button', label: 'Ok', action: 'ok' },
                { type: 'button', label: 'Cancel', action: 'cancel' }
            ],
            onfinish: (confirmed, values) => {
                if (confirmed && values.name && currentSelection) {
                    const table = model.getTable(currentSelection.tableUuid);
                    const nameColumn = table.columns.find(col => col.name === 'name');
                    const rowData = {};
                    if (nameColumn) {
                        rowData[nameColumn.colId] = values.name;
                    }
                    table.addRow(rowData);
                    hub.emit('instance-added');
                }
            }
        });
        
        const deleteInstanceBtn = $$(Button, {
            label: '🗑',
            onClick: () => {
                if (currentSelection) {
                    const table = model.getTable(currentSelection.tableUuid);
                    table.deleteRow(currentSelection.rowId);
                    hub.emit('instance-deleted');
                }
            }
        });
        
        const addPropertyToggle = $$(EditToggle, {
            idleLabel: '+ Property',
            editLabel: 'Add Property',
            editChildren: [
                { type: 'input', name: 'name', placeholder: 'property name' },
                { 
                    type: 'select',
                    name: 'datatype',
                    options: [
                        { value: '1', label: 'string' },
                        { value: '2', label: 'number' },
                        { value: '3', label: 'boolean' },
                        { value: '42', label: 'link' }
                    ]
                },
                { 
                    type: 'select',
                    name: 'targetType',
                    options: Array.from(model.tables.values()).map(t => ({ value: t.uuid, label: t.name })),
                    visibleWhen: { field: 'datatype', value: '42' }
                },
                { type: 'button', label: 'Ok', action: 'ok' },
                { type: 'button', label: 'Cancel', action: 'cancel' }
            ],
            onfinish: (confirmed, values) => {
                if (confirmed && values.name) {
                    const table = model.getTable(currentRootUuid);
                    const spec = {
                        name: values.name,
                        type: Number(values.datatype)
                    };
                    if (values.datatype === '42') {
                        spec.targetTableUuid = values.targetType;
                    }
                    table.addColumn(spec);
                    hub.emit('property-added');
                }
            }
        });
        
        const deletePropertyToggle = $$(EditToggle, {
            idleLabel: '🗑',
            idleClass: 'danger',
            editLabel: 'Delete Property',
            editChildren: [
                { 
                    type: 'select',
                    name: 'column',
                    options: () => {
                        const table = model.getTable(currentRootUuid);
                        return table ? table.columns.map(col => ({ value: col.colId, label: col.name })) : [];
                    }
                },
                { type: 'button', label: 'Ok', action: 'ok' },
                { type: 'button', label: 'Cancel', action: 'cancel' }
            ],
            onfinish: (confirmed, values) => {
                if (confirmed && values.column) {
                    const table = model.getTable(currentRootUuid);
                    table.removeColumn(values.column);
                    hub.emit('property-deleted');
                }
            }
        });
        
        box.add(tableSelect, 'left');
        box.add(addTypeToggle, 'left');
        box.add(renameToggle, 'left');
        box.add(deleteTypeBtn, 'left');
        box.add(addInstanceToggle, 'center');
        box.add(deleteInstanceBtn, 'center');
        box.add(addPropertyToggle, 'right');
        box.add(deletePropertyToggle, 'right');
        
        return box;
    }
    
    function rebuildToolbar(tableUuid) {
        if (toolbar) DOM.detach(toolbar);
        toolbar = buildToolbar(tableUuid);
        DOM.attach(toolbar, mainLayout, { slot: 'top' });
    }
    
    function buildTree(rootUuid) {
        const newTree = Tree({ itemClsid: TreeItem });
        
        const roots = treeIface.buildTree(rootUuid);
        
        let firstRoot = null;
        
        function addNodes(nodes, iTreeView) {
            const stack = [];
            for (let i = nodes.length - 1; i >= 0; i--) {
                stack.push({ node: nodes[i], parent: null });
            }
            
            while (stack.length > 0) {
                const { node, parent } = stack.pop();
                
                if (parent) {
                    iTreeView.select(parent, true);
                } else {
                    iTreeView.select(null, true);
                }
                
                const item = iTreeView.add({
                    label: node.label,
                    icon: node.icon,
                    type: node.type,
                    data: node.data
                });
                
                if (!firstRoot) firstRoot = item;
                
                if (node.children && node.children.length > 0) {
                    iTreeView.select(item, true);
                    for (let i = node.children.length - 1; i >= 0; i--) {
                        stack.push({ node: node.children[i], parent: item });
                    }
                }
            }
        }
        
        addNodes(roots, newTree);
        
        newTree.on('item-selected', (item) => {
            hub.emit('selection-changed', item);
        });

        return { treeView: newTree, firstRoot };
    }
    
    function rebuildTree() {
        if (treeView) DOM.detach(treeView);
        const ret = buildTree(currentRootUuid);
        treeView = ret.treeView;
        top_bottom.setTop(treeView);
        if (ret.firstRoot) {
            treeView.select(ret.firstRoot);
        }   
    }
    
    toolbar = buildToolbar(currentRootUuid);
    const ret = buildTree(currentRootUuid);
    treeView = ret.treeView;
    
    // propsView = $$(PropertyView, {});
    top_bottom = $$(TopBottom, {
        ratio: 0.6,
        top: treeView,
        bottom: null
    });

    mainLayout = $$(TopBottomStatic, {
        topHeight: 40,
        top: toolbar,
        bottom: top_bottom
    });

    if (ret.firstRoot) {
        treeView.select(ret.firstRoot);
    }
    
    return mainLayout;
}

export default createModelTreeEditor;