import { DomRegistry as DOM } from '../dom-registry.js';
import TreeView from '../dom-comps/tree-view.js';
import TreeItem from '../dom-comps/tree-item.js';

export function getRowLabel(model, tableUuid, rowId) {
    if (rowId === null || rowId === undefined) return '';
    
    const row = model.getRow(tableUuid, rowId);
    if (!row) return `Row ${rowId}`;
    
    const nameColumn = model.forColumns(tableUuid, col => col.name === 'name');
    if (nameColumn && row.data[nameColumn.colId]) {
        return row.data[nameColumn.colId];
    }
    
    const stringColumn = model.forColumns(tableUuid, col => col.type === 1);
    if (stringColumn && row.data[stringColumn.colId]) {
        return row.data[stringColumn.colId];
    }
    
    return `Row ${rowId}`;
}

export function getTableIcon(model, tableUuid) {
    const info = model.getTableInfo(tableUuid);
    if (!info) return '📄';
    
    const icons = {
        'City': '🏙️',
        'Building': '🏢',
        'Country': '🌍',
        'Person': '👤',
        'Architect': '📐'
    };

    return icons[info.name] || '📄';
}

export function addTreeNode(model, treeView, data, parent) {
    if (parent) {
        treeView.select(parent, true);
    } else {
        treeView.select(null, true);
    }
    
    return treeView.add({
        label: getRowLabel(model, data.tableUuid, data.rowId),
        icon: getTableIcon(model, data.tableUuid),
        type: 'folder',
        data
    });
}

export function buildTree(model, tableUuid) {
    const treeView = DOM.create(TreeView, { itemClsid: TreeItem });
    if (!treeView) return null;
    
    const tree = model.buildTree(tableUuid);
    
    function addNodes(nodes) {
        const stack = [];
        for (let i = nodes.length - 1; i >= 0; i--) {
            stack.push({ node: nodes[i], parent: null });
        }
        
        while (stack.length > 0) {
            const { node, parent } = stack.pop();

            // node is { tableUuid, rowId, children }
            const data = { tableUuid: node.tableUuid, rowId: node.rowId };
            const item = addTreeNode(model, treeView, data, parent);
            
            if (node.children && node.children.length > 0) {
                treeView.select(item, true);
                for (let i = node.children.length - 1; i >= 0; i--) {
                    stack.push({ node: node.children[i], parent: item });
                }
            }
        }
    }
    
    addNodes(tree);
    
    return treeView;
}
