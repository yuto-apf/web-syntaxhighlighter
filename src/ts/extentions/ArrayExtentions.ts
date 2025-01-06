interface Array<T> {
    clear(): void;
}

Object.defineProperties(Array.prototype, {
    clear: {
        configurable: true,
        enumerable: false,
        writable: true,
        value: function (this: Array<any>) {
            this.length = 0;
        },
    }
});