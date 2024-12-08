export function mod(a: number, b: number) {
    return a % b + ((a * b < 0) ? b : 0);
}

String.prototype.replaceFrom = function replaceFrom(pos: number, searchVal: string | RegExp, replacement: string) {
    if (pos < 0 || pos > this.length) return String(this);

    return this.slice(0, pos) + this.slice(pos).replace(searchVal, replacement);
};