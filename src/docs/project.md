# Shaper - A Data Modeling System

## Core concept
Demonstrate the isomorphism between a system of linked tables (Model) and a tree of typed instances (TreeView). The app shows both views simultaneously, proving they represent the same data.

## Architecture

### 1. DOM Registry (`src/dom-registry.js`)
- Central component factory with validation
- `DOM.create(clsid, options, ifaceName)` - creates components, returns interfaces
- `DOM.attach(source, target, options)` - attaches components via slots
- `DOM.detach(iface)` - removes from DOM
- `DOM.mount(iface)` - mounts root to document.body
- `validateScheme(scheme, data)` - deep-compares data against declared structure
- Components register with `DOM.register(ctor, roleCollector, info)`
- `info` includes: `clsid`, `name`, `description`, `scheme` (data validation)
- Role interfaces via prototype chain: `as(roleName)` returns role interface inheriting base `emit/on/once`

### 2. Mediator (`src/shared/mediator.js`)
- `on(event, callback)`, `off(event, callback)`, `emit(event, payload)`, `once(event, callback)`
- Used by base interface and compounds for coordination
- Compounds create a `hub = new Mediator()` and components communicate via it

### 3. Component patterns
- **ctor(args)** returns `{ getHost(), getInstance(), postCreate?(instance) }`
- `postCreate` runs after registry setup - attachments go there, not in ctor
- **Layout components** (LeftRight, TopBottom, TopBottomStatic, TabView, EditToggleBox): have slots, manage guest components
- **Guest components** (Button, SelectBox, TreeItem, EditToggle): fill slots, bring their own appearance
- **Complex leaf components** (TreeItem, EditToggle): have shadow DOM for internal structure
- **Simple components** (Button, SelectBox): no shadow DOM, host is the element itself
- **Guard dog**: hosts get inline styles with `!important` for layout-critical properties
- **Hotels** (Toolbar) set CSS custom properties (`--control-height`, `--control-padding`, etc.) that guests inherit

### 4. Model (`src/model/`)
- `Model`: collection of Tables, keyed by UUID. Only table-level operations.
- `Table`: collection of Columns and Rows. Emits events: `column.added`, `column.removed`, `column.renamed`, `column.swapped`, `row.added`, `row.deleted`, `cell.changed`
- `Column`: has `colId` (stable identity), `name` (display), `type` (1=string, 2=number, 3=boolean, 42=link), `targetTableUuid` (for links)
- `Row`: has `id`, `data` (keyed by colId), `refCount`
- Row data is keyed by `colId`, not column name

### 5. Data interfaces (`src/shared/`)
- `model2grid.js`: `createGridInterface(model, tableUuid)` - provides grid data for GridView
- `model2tree.js`: `createTreeInterface(model, config)` - provides tree data from model. `buildTree(rootTableUuid)` returns nested tree structure. `getChildren(tableUuid, rowIdx)` returns children items. Config includes `icons` mapping table names to emoji icons.
- `model2row.js`: `createRowDataInterface(model, tableUuid, rowIdx)` - provides row data for PropertyView

### 6. Key Components
- **TreeView** (`src/dom-comps/tree-view.js`): flat list of TreeItems with folding logic. `add(itemData)` returns the created item. `select(item, silent)`, `getSelected()`, `remove(item)`. Emits `item-selected`, `item-added`, `item-deleted`, `item-toggled`.
- **TreeItem** (`src/dom-comps/tree-item.js`): card with toggle button, icon, label. `setDepth(d)`, `setExpanded(b)`, `setSelected(b)`, `isFolder()`, `getData()`. Emits `clicked`, `toggle-clicked`, `label-changed`. dblclick on label enables editing.
- **TreeItemX** (`src/dom-comps/tree-item-x.js`): aggregation of TreeItem + delete button. Delegates methods, forwards events.
- **ListView** (`src/dom-comps/list-view.js`): flat list without folding. Uses same TreeItem components.
- **PropertyView** (`src/dom-comps/property-view.js`): dynamic container of property fields. Interface: `addNumber(name, value)`, `addString(name, value)`, `addBoolean(name, value)`, `addLink(name, options, value)`, `remove(name)`. Emits `value-changed`.
- **GridView** (`src/dom-comps/grid-view.js`): column-first table view. Internal column/cell logic, no separate ColumnView/CellView components.
- **EditToggle** (`src/dom-comps/edit-toggle.js`): button that toggles to inline edit form. `idleLabel`, `editLabel`, `editChildren` (config array), `onfinish(confirmed, values)`.
- **EditToggleBox** (`src/dom-comps/edit-toggle-box.js`): container for EditToggles with left/center/right sections. Manages exclusive edit mode.
- **SelectBox** (`src/dom-comps/select-box.js`): simple select element.
- **Button** (`src/dom-comps/button.js`): simple button element.

### 7. Compounds (`src/compounds/`)
- **model-tree-editor.js**: the tree-based Model editor. Layout: MainToolbar on top, TreeView + PropertyView below in dynamic split. Hub coordinates everything.
- **model-view.js**: the table-based Model editor (GridView + toolbar).
- **layout-test.js**: test harness that wraps a component in constrained center cell.
- **list-dialog.js** and **property-dialog.js**: older dialog compounds, may be obsolete.

## Design rules
- No recycling: when data changes completely, detach old component and create new one. No `clear()` and refill.
- Partial updates via interface methods.
- No functions in data objects. Data is pure. Communication via emit/on.
- Every input change is a breaking change. Components declare their `scheme` at registration. Registry validates.
- Auto-selection (without user click) happens AFTER layout is complete, not during build.
- In compound code, use `setTop`/`setBottom`/`setLeft`/`setRight` interface methods, not `DOM.attach`.

## Current state
- ModelTreeEditor is feature-complete for type CRUD, instance CRUD, property CRUD
- Toolbar layout: left (type selector, + Type, Rename, Delete Type), center (+ Instance, Delete Instance), right (+ Property, Delete Property)
- Property operations are TYPE-based (use `currentRootUuid`), not instance-based
- Instance operations are INSTANCE-based (use `currentSelection`)
- refreshProps uses selection's table if available, falls back to root table
- buildTree returns `{ tree, firstRoot }` - selection happens after layout

## Test data
`data/test-data-02.json` - City, Building, Country, Person, Architect tables with links.

## Known issues to fix
- "+ Instance" edit mode does not show type selector (childType options empty)
- PropertyView still shows previous selection when switching types (partially fixed)

## Next steps
- Fix + Instance type selector
- Test all operations systematically
- Then merge GridView and TreeView in Shaper-00 compound
- Verify synchronization between both views

## File structure
src/
    dom-registry.js
    shared/
        mediator.js
        dom-helper.js
        model2grid.js
        model2tree.js
        model2row.js
    dom-comps/
        button.js
        select-box.js
        edit-toggle.js (+ .html)
        edit-toggle-box.js (+ .html)
        tree-item.js (+ .html)
        tree-item-x.js
        tree-view.js
        list-view.js
        property-view.js
        grid-view.js
        left-right.js (+ .html)
        top-bottom.js (+ .html)
        top-bottom-static.js (+ .html)
        tab-view.js (+ .html)
        tab-header.js (+ .html)
        toolbar.js
        simple-view.js (+ .html)
    model/
        model.js
        table.js
        column.js
        row.js
        interface.js
    compounds/
        model-tree-editor.js
        model-view.js
        layout-test.js
        list-dialog.js
        property-dialog.js
        tree-view-test.js
        list-view-test.js
        property-view-test.js
    app/
        app.js
data/
    test-data-03.json
