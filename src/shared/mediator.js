// handles notifications

export class Mediator {
    constructor() {
        this.listeners = new Map();  // eventName → Set<callback>
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        return () => this.off(event, callback);  // auto-unsubscribe helper
    }

    off(event, callback) {
        const cbs = this.listeners.get(event);
        if (cbs) {
            cbs.delete(callback);
            if (cbs.size === 0) this.listeners.delete(event);
        }
    }

    emit(event, payload = null) {
        const cbs = this.listeners.get(event);
        if (cbs) {
            // Copy to avoid mutation-while-iterating issues
            [...cbs].forEach(cb => cb(payload));
        }
    }

    // Optional: once (fire once then off)
    once(event, callback) {
        const wrapped = (payload) => {
            callback(payload);
            this.off(event, wrapped);
        };
        return this.on(event, wrapped);
    }

    // Clear all (useful for tests/hot-reload)
    clear() {
        this.listeners.clear();
    }
}
