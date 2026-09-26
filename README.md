Demo: https://micage2.github.io/shaper-com/

# Shaper Conventions

## The three layers

### 1. Database (db.js)

- The single source of truth. Tables, columns, rows as plain data.
- Exposes: `on`, `off`, `emit` (events) plus CRUD commands (`createTable`, `createRow`, etc.).
- All events prefixed `db-`. Past-participle form:
  `db-table-created`, `db-column-created`, `db-row-created`, `db-cell-changed`,
  `db-table-deleted`, `db-table-renamed`, `db-column-deleted`, `db-column-renamed`,
  `db-row-deleted`.
- All entity IDs are internal. External interfaces use column/row names for
  identification, or opaque references.
- Every event payload carries `tableUuid`. For column/row events, also carries `id`
  (inside the row/column object) or `rowId`/`colId` (for standalone refs).

### 2. Compounds

- Factory functions. Return the root component interface, or an object
  `{ getRoot, ...commands }`.
- Receive a parent interface at creation. Use it for subscriptions and commands.
- Can hold a `Store` for local shared state.
- Predigest when the parent source provides more than children need. Forward
  otherwise.

### 3. Components

- Registered with the DOM registry. Self-contained. Receive `args` in ctor.
- Model-agnostic. Emit events, expose interfaces.
- No model access. Data arrives via args or events.
- No colors or fonts. Colors via CSS variables
  (`var(--bg)`, `var(--text)`, `var(--border)`, `var(--surface)`). Themes set them.

## Message rules

Direction:

- Down (parent to child): the parent creates a hub and passes it to the child.
  Only the parent emits on it.
- Up (child to parent): the parent subscribes to the child's root hub. The child
  emits on its own hub.

Forbidden:

- Forwarding an ancestor's hub to a child.
- Emitting on a parent's hub from a child.
- Storing state in a handler's closure for another handler's use.

Required:

- A message is an alternative to a function call; treat it like one.
- Handlers use only:
  1. the message payload,
  2. `this` (bound to a Store if shared state is needed),
  3. functions from the compound's own scope.

## Compound skeleton

    export default function MyCompound(parentIface, options) {
        const store = Store({ /* initial state */ });
    
        const layout = DOM.create(LR, {});
        const childA = ChildA(/* ... */);
        const childB = ChildB(/* ... */);
    
        layout.setLeft(childA);
        layout.setRight(childB);
    
        // parent -> me
        parentIface.on('something', function (data) {
            // handle
        });
    
        // children -> me
        childA.on('user-action', function (data) {
            // handle; may call parentIface.command or update store
        });
    
        // store
        store.on('change', ({ key, value, oldValue }) => {
            // react
        });
    
        return layout;
    }

## Naming

- Events: past-participle (`created`, `changed`, `deleted`).
- DB events: `db-` prefix.
- View events: no prefix.
- Commands (methods): imperative (`create`, `delete`, `rename`).
- Store keys: plain nouns (`currentTable`, `currentRow`).

## Themes

- Components use `var(--...)` for any color.
- Themes set variables on `:root` or `:root[data-theme="..."]`.
- No hardcoded colors, fonts, or backgrounds in components.

## What we avoid

- Global hubs.
- Closure variables shared across handlers.
- Forwarding ancestor hubs.
- Model access from components.
- Hardcoded colors.
- Recycling components: create new ones when state changes completely.