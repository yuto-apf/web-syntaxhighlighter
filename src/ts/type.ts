declare global {
    interface String {
        replaceFrom(pos: number, searchVal: string | RegExp, replacement: string): string;
    }
}

export interface Token {
    lexeme:    string
    type:      string
    className: ClassName
    tag?:      string[] 
};

export type ClassName = string | null;

export interface PatternList {
    pattern:   RegExp
    className: ClassName
};