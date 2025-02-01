export type ClassName = string | null;

interface Pattern {
    regexp:    RegExp
    className: string | null
};

export type PatternList = Record<string, Pattern>;