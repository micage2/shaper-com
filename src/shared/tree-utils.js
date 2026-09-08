import { DomRegistry as DOM } from '../dom-registry.js';
import TreeView from '../dom-comps/tree-view.js';
import TreeItem from '../dom-comps/tree-item.js';

export function getRowLabel(model, tableUuid, rowId) {
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

export function getTableIcon(tableName) {
    const icons = {
        'City': '🏙️',
        'Building': '🏢',
        'Country': '🌍',
        'Person': '👤',
        'Architect': '📐'
    };
    return icons[tableName] || '📄';
}

export function buildTree(model, tableUuid) {
    const treeView = DOM.create(TreeView, { itemClsid: TreeItem });
    if (!treeView) return null;
    
    const tree = model.buildTree(tableUuid);
    
    let firstItem = null;
    
    function addNodes(nodes) {
        const stack = [];
        for (let i = nodes.length - 1; i >= 0; i--) {
            stack.push({ node: nodes[i], parent: null });
        }
        
        while (stack.length > 0) {
            const { node, parent } = stack.pop();
            
            if (parent) {
                treeView.select(parent, true);
            } else {
                treeView.select(null, true);
            }
            
            const table = model.getTable(node.data.tableUuid);
            const tableName = table ? table.name : '';
            
            const item = treeView.add({
                label: getRowLabel(model, node.data.tableUuid, node.data.rowId),
                icon: getTableIcon(tableName),
                type: 'folder',
                data: node.data
            });
            
            if (!firstItem) firstItem = item;
            
            if (node.children && node.children.length > 0) {
                treeView.select(item, true);
                for (let i = node.children.length - 1; i >= 0; i--) {
                    stack.push({ node: node.children[i], parent: item });
                }
            }
        }
    }
    
    addNodes(tree);
    
    return { treeView, firstItem };
}
