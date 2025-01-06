export type ClassName = string | null;

export interface Token {
    lexeme:    string
    type:      string
    className: ClassName
    tag?:      string[] 
};

export interface PatternList {
    pattern:   RegExp
    className: ClassName
};