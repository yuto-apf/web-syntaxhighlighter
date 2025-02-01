import { ClassName } from './type';

export class Token {
    lexeme:    string;
    type:      string;
    className: ClassName;
    tags:      string[];

    constructor({
        lexeme    = '',
        type      = '',
        className = null,
        tags      = [] 
    }: {
        lexeme?:    string
        type?:      string
        className?: ClassName
        tags?:      string[]
    } = {}) {
        this.lexeme    = lexeme;
        this.type      = type;
        this.className = className;
        this.tags      = tags;
    }

    setLexeme(lexeme: string) {
        this.lexeme = lexeme;
        return this;
    }

    setType(type: string) {
        this.type = type;
        return this;
    }

    setClassName(className: ClassName) {
        this.className = className;
        return this;
    }

    addTag(tag: string) {
        this.tags.push(tag);
        return this;
    }

    removeTag(tag: string) {
        this.tags = this.tags.filter(t => t !== tag);
        return this;
    }

    hasTag(tag: string) {
        return this.tags.includes(tag);
    }

    isLexemeEqualTo(lex: string | string[]) {
        if (Array.isArray(lex)) {
            return lex.includes(this.lexeme);
        }
        return lex === this.lexeme;
    }

    isTypeEqualTo(type: string | string[]) {
        if (Array.isArray(type)) {
            return type.includes(this.type);
        }
        return type === this.type;
    }
}

export class TokenArray extends Array<Token> {
    replace(pos: number, tokens: TokenArray) {
        this.splice(pos, 1, ...tokens);
        return this;
    }

    findIndexByLexeme(lex: string, startPos = 0) {
        if (startPos >= this.length) return -1;

        for (let i = Math.max(0, startPos); i < this.length; i++) {
            if (this[i].lexeme === lex) return i;
        }
        return -1;
    }

    findLastIndexByLexeme(lex: string, startPos = this.length - 1) {
        for (let i = Math.min(startPos, this.length - 1); i >= 0; i--) {
            if (this[i].lexeme === lex) return i;
        }
        return -1;
    }

    findIndexByType(type: string, startPos = 0) {
        if (startPos >= this.length) return -1;

        for (let i = Math.max(0, startPos); i < this.length; i++) {
            if (this[i].type === type) return i;
        }
        return -1;
    }

    findLastIndexByType(type: string, startPos = this.length - 1) {
        for (let i = Math.min(startPos, this.length - 1); i >= 0; i--) {
            if (this[i].type === type) return i;
        }
        return -1;
    }
}