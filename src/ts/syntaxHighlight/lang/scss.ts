import Syntaxhighlight from '../base';
import { Token, PatternList } from '../type';


const patternLists: { [key: string]: PatternList } = {
    comment:   { pattern: /^(?:\/\/.*|\/\*[\s\S]*?\*\/|\/\*[\s\S]*)/,     className: 'hl-cm'  },
    propVal:   { pattern: /^\S+\s*:\s*[^{](?:[^{]|\s)*?;/,                className: null     },  
    keyword1:  { pattern: /^(?:as)(?!\w)/,                                className: 'hl-k1'  },
    keyword2:  { pattern: /^(?:\*)(?!\w)/,                                className: 'hl-k2'  },
    string:    { pattern: /^(["']).*?\1/,                                 className: 'hl-str' },
    atRules:   { pattern: /^@(?:use|else)(?!\w)/,                         className: 'hl-at'  },
    include:   { pattern: /^@include\s+\S[\s\S]*?;/,                      className: null     },
    extend:    { pattern: /^@extend\s+\S+\s*?;/,                          className: null     },
    if:        { pattern: /^@(?:else\s+)?if\s+\S[\s\S]*?{/,               className: null     },
    userDef:   { pattern: /^@(?:keyframes|mixin|function)\s+\S[\s\S]*?{/, className: null     },
    selectors: { pattern: /^(?:[&.#\[>+~\w][\s\S]*?|:root\s*){/,          className: null     },
};

export default class SCSSHighlight extends Syntaxhighlight {
    constructor(src: string) {
        super(src, patternLists);
    }

    parseTokens() {
        const newTokens: Token[] = [];
        
        // TODO: for, each, etc...
        this.tokens.forEach(token => {
            switch (token.type) {
                case 'comment':   newTokens.push({...token, tag: ['ignoreHighlightBrackets']}); break;
                case 'propVal':   newTokens.push(...this.parsePropVal(token.lexeme));           break;
                case 'include':   newTokens.push(...this.parseInclude(token.lexeme));           break;
                case 'extend':    newTokens.push(...this.parseExtend(token.lexeme));            break;
                case 'if':        newTokens.push(...this.parseIf(token.lexeme));                break;
                case 'userDef':   newTokens.push(...this.parseUserDef(token.lexeme));           break;
                case 'selectors': newTokens.push(...this.parseSelectors(token.lexeme));         break;
                default:          newTokens.push(token);
            }
        });

        this.tokens = this.highlightEscapeSequence(newTokens);
        this.tokens = this.highlightBrackets(this.tokens);
    }

    private parsePropVal(lex: string) {
        const tokens: Token[] = [];

        const lexemes = lex.splitWithRest(':', 1); // split with first ':'. (e.g.) 'a:b:c' => ['a', 'b:c']
        const prop    = lexemes[0].trim();
        const values  = lexemes[1].slice(0, -1).trim();

        tokens.push({ lexeme: prop, type: 'property', className: 'hl-prop' });
        tokens.push({ lexeme: ':',  type: 'other',    className: null });
        tokens.push(...this.parseValues(values));
        tokens.push({ lexeme: ';',  type: 'other',    className: null });
        
        return tokens;
    }

    private parseValues(lex: string) {
        const patternLists: { [key: string]: PatternList } = {
            number:     { pattern: /^(?:-?\.?[0-9]+(?:px|rem|em|%|vw|vh|vmin|vmax|s)?)/,    className: 'hl-n'   },
            color:      { pattern: /^#[0-9a-fA-F]*/,                                        className: 'hl-val' },
            string:     { pattern: /^(["']).*?\1/,                                          className: 'hl-str' },
            important:  { pattern: /^!important/,                                           className: 'hl-k2'  },
            operator:   { pattern: /^(?:and|or|not)/,                                       className: null     },  // For expression
            boolean:    { pattern: /^true|false/,                                           className: null     },  // For expression
            funcCall:   { pattern: /^[A-Za-z_$][\w$-]*\s*\(\s*(?:[^()]*|\([^()]*\))*\s*\)/, className: null     },
            identifier: { pattern: /^(?:--)?[A-Za-z_$][\w$-]*/,                             className: null     },
        }
    
        const tokens = this.lexicalAnalysis(lex, patternLists);
        const newTokens: Token[] = [];
    
        tokens.forEach(token => {
            switch (token.type) {
                case 'funcCall':   newTokens.push(...this.parseFuncHead(token.lexeme)); break;
                case 'identifier': newTokens.push(this.parseIdentifier(token.lexeme));  break;
                default:           newTokens.push(token);
            }
        });
        
        return newTokens;
    }

    private parseIdentifier(lex: string){
        return lex.startsWith('$') || lex.startsWith('--')
            ? { lexeme: lex, type: 'variable', className: 'hl-v' }
            : { lexeme: lex, type: 'value',    className: 'hl-val' }
    }

    private parseFuncHead(lex: string) {
        const patternLists: { [key: string]: PatternList } = {
            identifier: { pattern: /^[A-Za-z_$-][\w$-]*/, className: null },
            argList:    { pattern: /^\([\s\S]*\)/,        className: null },
        }
        const tokens = this.lexicalAnalysis(lex, patternLists);

        const funcNameToken = tokens.filter(({ type }) => type === 'identifier');
        const argListToken  = tokens.filter(({ type }) => type === 'argList');

        if (!argListToken.length) return [{ lexeme: lex, type: 'function', className: 'hl-f' }];

        const funcName = funcNameToken[0].lexeme;
        const args     = argListToken[0].lexeme.slice(1, -1).trim();

        tokens.clear();
        tokens.push({ lexeme: funcName, type: 'function', className: 'hl-f' });
        tokens.push({ lexeme: '(',      type: 'other',    className: null });
        tokens.push(...this.parseArgs(args));
        tokens.push({ lexeme: ')',      type: 'other',    className: null });  

        return tokens;
    }

    private parseArgs(lex: string) {
        const tokens: Token[] = [];

        const args = lex.split(',');
        
        args.forEach(arg => {
            arg = arg.trim();
            if (arg.includes(':')) tokens.push(...this.parseOptArg(arg)); 
            else                   tokens.push(...this.parseValues(arg)); // normal argument => treat as 'values' and parse it.
            tokens.push({ lexeme: ',', type: 'other', className: null });
        });
        tokens.pop();

        return tokens;
    }

    private parseOptArg(lex: string) {
        const tokens: Token[] = [];

        const lexemes  = lex.split(':');
        const variable = lexemes[0].trim();
        const value    = lexemes[1];

        tokens.push({ lexeme: variable, type: 'variable', className: 'hl-prop' });
        tokens.push({ lexeme: ':',      type: 'other',    className: null });
        tokens.push(...this.parseValues(value));
        
        return tokens;
    }

    private parseInclude(lex: string) {
        const tokens: Token[] = [];

        const mixin  = lex.split('@include')[1].trim().slice(0, -1).trim();
    
        tokens.push({ lexeme: '@include',  type: 'atRules',  className: 'hl-at' });
        tokens.push(...this.parseFuncHead(mixin));
        tokens.push({ lexeme: ';',         type: 'other',    className: null });

        return tokens;
    }

    private parseExtend(lex: string) {
        const tokens: Token[] = [];

        const lexemes  = lex.split(/\s+/);
        const keyword  = lexemes[0];
        const selector = lexemes[1].split(';')[0].trim();
        
        tokens.push({ lexeme: keyword,  type: 'atRules',  className: 'hl-at' });
        tokens.push({ lexeme: selector, type: 'selector', className: 'hl-sel' });
        tokens.push({ lexeme: ';',      type: 'other',    className: null });

        return tokens;
    }

    private parseIf(lex: string) {
        const tokens: Token[] = [];

        const atRules = lex.startsWith('@if') ? ['@if'] : ['@else', 'if'];
        const expr    = lex.split(/if/)[1].slice(0, -1).trim();
        
        atRules.forEach(lex => {
            tokens.push({ lexeme: lex, type: 'atRules', className: 'hl-at' });
        });
        tokens.push(...this.parseValues(expr));
        tokens.push({ lexeme: '{', type: 'other', className: null });  

        return tokens;        
    }

    private parseUserDef(lex: string) {
        const tokens: Token[] = [];

        const lexemes  = lex.splitWithRest(/\s+/, 1);
        const atRule   = lexemes[0];
        const funcHead = lexemes[1].slice(0, -1).trim();

        tokens.push({ lexeme: atRule, type: 'atRules', className: 'hl-at' });
        tokens.push(...this.parseFuncHead(funcHead));
        tokens.push({ lexeme: '{',    type: 'other',   className: null });  

        return tokens;
    }

    private parseSelectors(lex: string) {
        const patternLists: { [key: string]: PatternList } = {
            symbol:   { pattern: /^(?:&|\*)/,               className: 'hl-k2'  },
            selector: { pattern: /^[.#]?[A-Za-z_:][\w:-]*/, className: 'hl-sel' },
            attr:     { pattern: /^\[.*?\]/,       className: null     },
        };
        const tokens = this.lexicalAnalysis(lex, patternLists);
        const newTokens: Token[] = [];

        tokens.forEach(token => {
            if (token.type === 'attr') newTokens.push(...this.parseAttr(token.lexeme));
            else                       newTokens.push(token);
        });

        return newTokens;
    }

    private parseAttr(lex: string) {
        const tokens: Token[] = [];

        const lexemes = lex.slice(1, -1).split('=');
        const attr    = lexemes[0].trim();
        const value   = lexemes.length > 1 ? lexemes[1].trim() : null;

        tokens.push({ lexeme: '[',  type: 'other', className: null });
        tokens.push({ lexeme: attr, type: 'attr',  className: 'hl-attr' });
        if (value) {
            tokens.push({ lexeme: '=',   type: 'other', className: null });
            tokens.push({ lexeme: value, type: 'value', className: 'hl-val' });
        }
        tokens.push({ lexeme: ']', type: 'other', className: null });

        return tokens;
    }
}