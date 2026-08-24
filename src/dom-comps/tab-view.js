import { DomRegistry as DOM } from '../dom-registry.js';
import { loadFragment } from '../shared/dom-helper.js';
import TabHeader from './tab-header.js';

const html_file = "./src/dom-comps/tab-view.html";
const fragment = await loadFragment(html_file);

const defaults = {
    tabClsid: TabHeader
}

function ctor(args = {...defaults}) {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'closed' });
    
    const clone = fragment.cloneNode(true);
    shadow.appendChild(clone);
    
    const headerItemClsid = args.headerItemClsid || defaults.tabClsid;
    const tabs = new Map(); // name -> { header, body }
    let selectedTab = '';
    
    return {
        getHost() { return host; },
        getInstance() { return { headerItemClsid, tabs, selectedTab }; }
    };
}

const ITabView = (instance) => ({
    add(name, bodyIface, options = {}) {
        const headerIface = DOM.create(instance.headerItemClsid, {
            icon: options.icon,
            label: name,
            onClick: () => this.select(name),
            onClose: () => this.remove(name),
        });
        
        DOM.attach(headerIface, this, { slot: 'header' });
        
        instance.tabs.set(name, {
            header: headerIface,
            body: bodyIface
        });
        
        if (!instance.selectedTab) {
            this.select(name);
        }
        
        return this;
    },
    
    select(name) {
        const pair = instance.tabs.get(name);
        if (!pair) return this;
        
        // Detach old body
        if (instance.selectedTab && instance.tabs.has(instance.selectedTab)) {
            const oldPair = instance.tabs.get(instance.selectedTab);
            if (oldPair.body) {
                DOM.detach(oldPair.body);
            }
            if (oldPair.header && oldPair.header.setActive) {
                oldPair.header.setActive(false);
            }
        }
        
        instance.selectedTab = name;
        
        // Activate new
        if (pair.header && pair.header.setActive) {
            pair.header.setActive(true);
        }
        DOM.attach(pair.body, this, { slot: 'body' });
        
        return this;
    },
    
    remove(name) {
        const pair = instance.tabs.get(name);
        if (!pair) return this;
        
        if (name === instance.selectedTab) {
            if (pair.header) DOM.detach(pair.header);
            if (pair.body) DOM.detach(pair.body);
            instance.selectedTab = '';
        } else {
            if (pair.header) DOM.detach(pair.header);
        }
        
        instance.tabs.delete(name);
        
        // Select first remaining tab
        if (!instance.selectedTab && instance.tabs.size > 0) {
            const firstName = instance.tabs.keys().next().value;
            this.select(firstName);
        }
        
        return this;
    },
    
    getSelectedTab() {
        return instance.selectedTab;
    }
});

const info = {
    clsid: 'jscom.dom-comps.tab-view',
    name: 'TabView',
    description: 'Container with tab headers and switchable bodies'
};

DOM.register(ctor, (role) => {
    role('TabView', ITabView, true);
}, info);

export default info.clsid;