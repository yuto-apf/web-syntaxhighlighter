interface String {
    splitWithRest(separator: string | RegExp, limit?: number): string[];
    replaceFrom(pos: number, searchVal: string | RegExp, replacement: string): string;
}

Object.defineProperties(String.prototype, {
    splitWithRest: {
        configurable: true,
        enumerable: false,
        writable: true,
        // value: function (separator: string, limit?: number) {
        //     if (limit === 0)         return [];
        //     if (limit === undefined) return this.split(separator);

        //     let rest  = String(this);
        //     const ary = [];
            
        //     limit--;
        //     while (--limit) {
        //         const idx = rest.indexOf(separator);
        //         if (idx !== -1) {
        //             ary.push(rest.slice(0, idx));
        //             rest = rest.slice(idx + 1);
        //         } else {
        //             break;
        //         }
        //     }

        //     return [...ary, rest];
        // },
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
    }
});