import Syntaxhighlight from '../base';
import { Token, PatternList } from '../type';


const patternLists: { [key: string]: PatternList } = {
    comment: { pattern: /^(?:<!--[\s\S]*?-->|<!--[\s\S]*)/, className: 'hl-cm' },
    tag:     { pattern: /^(?:<[\s\S]*?>)/,                  className: null    },
};

export default class HTMLHighlight extends Syntaxhighlight {
    constructor(src: string) {
        super(src, patternLists);
    }

    parseTokens() {
        const newTokens: Token[] = [];

        this.tokens.forEach(token => {
            switch (token.type) {
                case 'tag': newTokens.push(...this.parseTag(token.lexeme)); break;
                default:    newTokens.push(token);
            }
        });

        this.tokens = newTokens;
    }

    private parseTag(lex: string) {
        const patternLists: { [key: string]: PatternList } = {
            tagOpen:    { pattern: /^<[!\/]?/,           className: 'hl-tag' },
            tagClose:   { pattern: /^\/?>/,              className: 'hl-tag' },
            identifier: { pattern: /^[a-zA-Z_][\w:.-]*/, className: null     },
            equal:      { pattern: /^=/,                 className: null     },
            value:      { pattern: /^(["']).*?\1/,       className: 'hl-str' },
        };
        const tokens = this.lexicalAnalysis(lex, patternLists);
 
        tokens.forEach(({ lexeme, type }, i) => {
            if (type !== 'identifier') return;
            if (i === 1) tokens[i] = { lexeme, type: 'tagName', className: 'hl-tn'  };
            else         tokens[i] = { lexeme, type: 'attr',    className: 'hl-attr'};
        });

        return tokens;
    }
}