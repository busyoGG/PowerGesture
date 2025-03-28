(function () {
    const _addEventListener = EventTarget.prototype.addEventListener;
    const _removeEventListener = EventTarget.prototype.removeEventListener;

    EventTarget.prototype.eventListeners = new Map();

    EventTarget.prototype.addEventListener = function (type, listener, options) {
        if (!this.eventListeners.has(type)) {
            this.eventListeners.set(type, new Set());
        }
        this.eventListeners.get(type).add(listener);
        _addEventListener.call(this, type, listener, options);
    };

    EventTarget.prototype.removeEventListener = function (type, listener, options) {
        if (this.eventListeners.has(type)) {
            this.eventListeners.get(type).delete(listener);
        }
        _removeEventListener.call(this, type, listener, options);
    };

    EventTarget.prototype.removeAllEventListeners = function () {
        for (const [type, listeners] of this.eventListeners.entries()) {
            for (const listener of listeners) {
                this.removeEventListener(type, listener);
            }
        }
        this.eventListeners.clear();
    };
})();

console.log("预加载", document.querySelector("#read-only-cursor-text-area"))
