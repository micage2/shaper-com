import { DomRegistry as DOM } from '../dom-registry.js';
import TreeView from '../dom-comps/tree-view.js';
import TreeItem from '../dom-comps/tree-item.js';

export function getRowLabel(model, tableUuid, rowId) {
    if (rowId === null || rowId === undefined) return '';
    
    const table = model.getTable(tableUuid);
    if (!table) return `Row ${rowId}`;
    
    const row = table.getRow(rowId);
    if (!row) return `Row ${rowId}`;
    
    const nameColumn = table.forColumns(col => col.name === 'name');
    if (nameColumn && row.data[nameColumn.colId]) {
        return row.data[nameColumn.colId];
    }
    
    const stringColumn = table.forColumns(col => col.type === 1);
    if (stringColumn && row.data[stringColumn.colId]) {
        return row.data[stringColumn.colId];
    }
    
    return `Row ${rowId}`;
}

export function getTableIcon(model, tableUuid) {
    const table = model.getTable(tableUuid);
    if (!table) return '📄';
    
    const icons = {
        'City': '🏙️',
        'Building': '🏢',
        'Country': '🌍',
        'Person': '👤',
        'Architect': '📐'
    };

    return icons[table.name] || '📄';
}

export function addTreeNode(model, treeView, row, parent) {
    if (parent) {
        treeView.select(parent, true);
    } else {
        treeView.select(null, true);
    }
    
    const table = model.getTable(row.tableUuid);
    const tableName = table ? table.name : '';
    
    return treeView.add({
        label: getRowLabel(model, row.tableUuid, row.rowId),
        icon: getTableIcon(model, row.tableUuid),
        type: 'folder',
        data: row
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

            const item = addTreeNode(model, treeView, node.data, parent);
            
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
