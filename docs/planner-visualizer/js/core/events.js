/**
 * Simple Event Emitter
 * Base class for handling event subscriptions and dispatching.
 */
export class EventEmitter {
    constructor() {
        this.listeners = new Map(); // eventType -> [callback, ...]
    }

    /**
     * Registers a callback for a specific event.
     * @param {string} eventType 
     * @param {Function} callback 
     */
    addEventListener(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(callback);
    }

    /**
     * Dispatches an event to all registered listeners.
     * @param {string} eventType 
     * @param {any} payload 
     */
    emit(eventType, payload) {
        const callbacks = this.listeners.get(eventType);
        if (callbacks) {
            callbacks.forEach(cb => cb(payload));
        }
    }
}
