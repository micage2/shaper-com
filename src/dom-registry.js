import { Mediator } from './shared/mediator.js';

const klasses = new Map();           // clsid -> { ctor, roles, defaultRole, info }
const ifaceToInstance = new WeakMap(); // any role iface -> instance
const instanceRoles = new WeakMap();   // instance -> Map<roleName, roleIface>
const instanceHosts = new WeakMap();   // instance -> host

const gen_id = () => Math.random().toString(36).slice(2, 11);

function register(ctor, roleCollector, info = {}) {
    if (!info.clsid) {
        console.error('[DOM] No clsid.', info);
        return false;
    }
    
    if (klasses.has(info.clsid)) {
        console.warn(`[DOM] Component already registered: ${info.clsid}`);
        return false;
    }
    
    const roles = new Map();
    let defaultRole = null;
    
    const role = (name, impl, isDefault) => {
        roles.set(name, impl);
        if (isDefault) defaultRole = name;
    };
    
    if (typeof roleCollector === 'function') {
        roleCollector(role);
    }
    
    klasses.set(info.clsid, { ctor, roles, defaultRole, info });
    return true;
}

function create(clsid, options = {}, ifaceName) {
    const klass = klasses.get(clsid);
    if (!klass) {
        console.error(`[DOM] Unknown component type: ${clsid}`);
        return null;
    }
    
    // Create base interface
    const iface = {
        uid: gen_id(),
        type: clsid,
        mediator: null, // set after ctor
        
        as(roleName) {
            const instance = ifaceToInstance.get(this);
            if (!instance) return null;
            
            let roles = instanceRoles.get(instance);
            if (!roles) {
                roles = new Map();
                instanceRoles.set(instance, roles);
            }
            
            if (roles.has(roleName)) {
                return roles.get(roleName);
            }
            
            const roleFactory = klass.roles.get(roleName);
            if (!roleFactory) {
                console.warn(`[DOM] No role '${roleName}' on ${klass.info.clsid}`);
                return null;
            }
            
            const roleImpl = roleFactory.bind(this)(instance);
            const roleIface = Object.create(this);
            Object.assign(roleIface, roleImpl);
            
            roles.set(roleName, roleIface);
            ifaceToInstance.set(roleIface, instance);
            
            return roleIface;
        },
                
        emit(msg, payload = null) {
            if (this.mediator) {
                this.mediator.emit(msg, payload);
            }
        },
        
        on(msg, cb) {
            if (!this.mediator) return null;
            return this.mediator.on(msg, cb);
        },
        
        once(msg, cb) {
            if (!this.mediator) return null;
            return this.mediator.once(msg, cb);
        }
    };
    
    // Call ctor with this = iface
    const icomp = klass.ctor.bind(iface)(options);
    
    if (!icomp) {
        console.error(`[DOM] Invalid component: ${clsid}`);
        return null;
    }
    
    const instance = icomp.getInstance();
    const host = icomp.getHost();

    // automatic class name
    const className = clsid.split('.').pop() + '-host';
    host.classList.add(className);

    // Store instance and host
    ifaceToInstance.set(iface, instance);
    instanceHosts.set(instance, host);
    instanceRoles.set(instance, new Map());
    
    // Create mediator per instance
    iface.mediator = new Mediator();
    
    // Post-create hook
    if (icomp.postCreate) {
        icomp.postCreate.bind(iface)(instance);
    }
    
    // Return requested interface or default
    if (ifaceName) {
        return iface.as(ifaceName);
    }
    
    if (klass.defaultRole) {
        return iface.as(klass.defaultRole);
    }
    
    return iface;
}

function attach(sourceIface, targetIface, options = {}) {
    const sourceInstance = ifaceToInstance.get(sourceIface);
    if (!sourceInstance) {
        console.warn('[DOM.attach] Invalid source');
        return false;
    }
    
    const targetInstance = ifaceToInstance.get(targetIface);
    if (!targetInstance) {
        console.warn('[DOM.attach] Invalid target');
        return false;
    }
    
    const sourceHost = instanceHosts.get(sourceInstance);
    const targetHost = instanceHosts.get(targetInstance);
    
    if (!sourceHost || !targetHost) {
        console.warn('[DOM.attach] No host found');
        return false;
    }
    
    sourceHost.slot = options.slot || '';
    
    switch (options.mode || 'parent') {
        case 'parent':
            targetHost.appendChild(sourceHost);
            break;
        case 'before':
            targetHost.parentNode?.insertBefore(sourceHost, targetHost);
            break;
        case 'after':
            targetHost.parentNode?.insertBefore(sourceHost, targetHost.nextSibling);
            break;
        default:
            console.warn(`[DOM.attach] Invalid mode: ${options.mode}`);
            return false;
    }
    
    return true;
}

function detach(iface) {
    const instance = ifaceToInstance.get(iface);
    if (!instance) return false;
    
    const host = instanceHosts.get(instance);
    if (!host || !host.parentNode) return false;
    
    host.parentNode.removeChild(host);
    return true;
}

function mount(rootIface) {
    const instance = ifaceToInstance.get(rootIface);
    if (!instance) {
        console.warn('[DOM.mount] No instance for interface');
        return false;
    }
    
    const host = instanceHosts.get(instance);
    if (!host) {
        console.warn('[DOM.mount] No host for instance');
        return false;
    }
    
    let rootEl = document.getElementById('app-root');
    if (!rootEl) {
        rootEl = document.createElement('div');
        rootEl.id = 'app-root';
        rootEl.style.cssText = 'height:100vh;width:100vw;margin:0;overflow:hidden;';
        document.body.appendChild(rootEl);
    }
    
    rootEl.appendChild(host);
    return true;
}

export const DomRegistry = {
    register,
    create,
    attach,
    detach,
    mount
};
