export function mod(a: number, b: number) {
    return a % b + ((a * b < 0) ? b : 0);
}