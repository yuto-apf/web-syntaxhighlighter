import SyntaxHighlighter from '../base';
import { Token } from '../token';
import { PatternList } from '../type';

// TODO: To highlight JS within script tags and CSS within style tags.
 
const patternList: PatternList = {
    comment:    { regexp: /^(?:<!--[\s\S]*?-->|<!--[\s\S]*)/, className: 'hl-cm'  },
    tagOpen:    { regexp: /^<[!\/]?/,                         className: 'hl-tag' },
    tagClose:   { regexp: /^\/?>/,                            className: 'hl-tag' },
    identifier: { regexp: /^[a-zA-Z_][\w:.-]*/,               className: null     },
    equal:      { regexp: /^=/,                               className: null     },
    value:      { regexp: /^(["']).*?\1/,                     className: 'hl-str' },
};

export default class HTMLHighlighter extends SyntaxHighlighter {
    constructor(src: string) {
        super(src, patternList);
    }

    parseTokens() {
        for (let i = 0; i < this.tokens.length; i++) {
            const token = this.tokens[i];
            if (token.type === 'identifier') this.parseIdentifier(i);
        }
    }

    private parseIdentifier(pos: number) {
        const prevToken = (pos > 0) ? this.tokens[pos - 1] : new Token();
        
        if (prevToken.isTypeEqualTo('tagOpen'))              this.tokens[pos].setType('tagName').setClassName('hl-tn');
        if (prevToken.isTypeEqualTo(['tagName', 'value']))   this.tokens[pos].setType('attr').setClassName('hl-attr');
    }
}