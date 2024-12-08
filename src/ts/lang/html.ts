import Syntaxhighlight from '../syntaxHighlight';
import { Token, PatternList } from '../type';


const patternLists: { [key: string]: PatternList } = {
    comment:    { pattern: /^(?:<!--[\s\S]*?-->|<!--[\s\S]*)/, className: 'hl-cm' },
    tag:        { pattern: /^(?:<[\s\S]*?>)/, className: null },
}

export default class HTMLHighlight extends Syntaxhighlight {
    constructor(src: string) {
        super(src, patternLists);
    }

    parseTokens() {
        const newTokens: Token[] = [];

        this.tokens.forEach(token => {
            switch (token.type) {
                case 'tag': newTokens.push(...this.parseTag(token)); break;
                default:    newTokens.push(token);
            }
        });

        this.tokens = newTokens;

        // TODO: replaceにより、ここから渡すposが更新後には違う => 常に最新のthis.tokensを見れるように? or 確定、未確定を保持し、未確定のものを見ていく
    }

    private parseTag(token: Token) {
        const patternLists: { [key: string]: PatternList } = {
            tagOpen:    { pattern: /^<[!\/]?/,           className: 'hl-tag' },
            tagClose:   { pattern: /^\/?>/,              className: 'hl-tag' },
            identifier: { pattern: /^[a-zA-Z_][\w:.-]*/, className: null },
            equal:      { pattern: /^=/,                 className: null },
            value:      { pattern: /^(["']).*?\1/,       className: 'hl-str' },
        }

        const tokens = this.lexicalAnalysis(token.lexeme, patternLists);
        // identifier => tagName or attribute
        tokens.forEach(({ lexeme, type }, i) => {
            if (type !== 'identifier') return;
            if (i === 1) tokens[i] = { lexeme, type: 'tagName', className: 'hl-tn'};
            else         tokens[i] = { lexeme, type: 'attr',    className: 'hl-attr'};
        });

        return tokens;
    }
}