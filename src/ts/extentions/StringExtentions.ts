interface String {
    splitWithRest(separator: string | RegExp, limit?: number): string[];
    replaceFrom(pos: number, searchVal: string | RegExp, replacement: string): string;
    toRegExp(): RegExp;
}

Object.defineProperties(String.prototype, {
    splitWithRest: {
        configurable: true,
        enumerable: false,
        writable: true,
        value: function (separator: string | RegExp, limit?: number) {
            if (limit === undefined) return this.split(separator);
            if (limit < 0)           return this.split(separator);
            if (limit === 0)         return [String(this)];

            let   rest = String(this);
            const ary = [];

            const parts = String(this).split(separator);

            while (limit--) {
                const part = parts.shift();
                if (part === undefined) break;
                ary.push(part);
                rest = rest.slice(part.length);
                const match = rest.match(separator);
                if (match) rest = rest.slice(match[0].length);
            }
            if (parts.length > 0) ary.push(rest);

            return ary;
        },
    },
    replaceFrom: {
        configurable: true,
        enumerable: false,
        writable: true,
        value: function (pos: number, searchVal: string | RegExp, replacement: string) {
            if (pos < 0 || pos > this.length) return String(this);
            return this.slice(0, pos) + this.slice(pos).replace(searchVal, replacement);
        },
    },
    toRegExp: {
        configurable: true,
        enumerable: false,
        writable: true,
        value: function () {
            return new RegExp(`^(${this.split(' ').join('|')})(?!\\w)`);
        },
    }
});