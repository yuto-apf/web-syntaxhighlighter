import SyntaxHighlighter from '../base';
import { Token } from '../token';
import { PatternList } from '../type';


const patternList: PatternList = {
    comment:    { regexp: /^(?:\/\/.*|\/\*[\s\S]*?\*\/|\/\*[\s\S]*)/,                        className: 'hl-cm'  },
    keyword1:   { regexp: /^(?:as)(?!\w)/,                                                   className: 'hl-k1'  },
    keyword2:   { regexp: /^(?:&|!important|true|false)/,                                    className: 'hl-k2'  },
    if:         { regexp: /^@(?:else[ ]+)?if/,                                               className: 'hl-at'  },
    atRules:    { regexp: /^@(?:use|keyframes|function|mixin|include|extend|else|for|each)/, className: 'hl-at'  },
    logicalOp:  { regexp: /^(?:and|or|not)/,                                                 className: null     },
    color:      { regexp: /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})/,                             className: 'hl-val' },
    variable:   { regexp: /^(?:--|\$)[A-Za-z_$][\w$-]*/,                                     className: 'hl-v'   },
    identifier: { regexp: /^[.#]?-?[A-Za-z_][\w-]*/,                                         className: null     },
    number:     { regexp: /^(?:-?\.?[0-9]+(?:px|rem|em|%|vw|vh|vmin|vmax|s)?)/,              className: 'hl-n'   },
    string:     { regexp: /^(["']).*?\1/,                                                    className: 'hl-str' },
    equivalent: { regexp: /^==/,                                                             className: null     },
    asterisk:   { regexp: /^\*/,                                                             className: null     },
    coron:      { regexp: /^:/,                                                              className: null     },
    semic:      { regexp: /^;/,                                                              className: null     },
    connector:  { regexp: /^[,>+~]/,                                                         className: null     },
};

export default class SCSSHighlighter extends SyntaxHighlighter {
    constructor(src: string) {
        super(src, patternList);
    }

    parseTokens() {
        for (let i = 0; i < this.tokens.length; i++) {
            const token = this.tokens[i];
            switch (token.type) {
                case 'comment':      this.tokens[i].addTag('ignoreHighlightBrackets'); break;
                case 'if':           this.parseIf(i);                                  break;
                case 'color':        this.parseColor(i);                               break;
                case 'identifier':   this.parseIdentifier(i);                          break;
                case 'coron':        this.parseCoron(i);                               break;
            }
        }
        for (let i = 0; i < this.tokens.length; i++) {
            const token = this.tokens[i];
            switch (token.type) {
                case 'identifier': this.tokens[i].setType('value').setClassName('hl-val'); break;
                case 'asterisk':   this.parseAsterisk(i);                                  break;
                case 'coron':      this.parseCoron(i);                                     break;
            }
        }

        this.highlightBrackets()
            .highlightEscapeSequence();
    }

    private parseIf(pos: number) {
        const from = pos + 1;
        const to   = this.tokens.findIndexByLexeme('{', pos) - 1;
        for (let i = from; i <= to; i++) {
            const token = this.tokens[i];
            if      (token.isTypeEqualTo('identifier')) this.tokens[i].setType('value').setClassName('hl-val');
            else if (token.isTypeEqualTo('color'))      this.tokens[i].addTag('ignoreParseColor');
        }
    }

    private parseColor(pos: number) {
        if (!this.tokens[pos].hasTag('ignoreParseColor') && this.isSelector(pos)) this.tokens[pos].setType('selector').setClassName('hl-sel');
    }

    private parseIdentifier(pos: number) {
        const prevToken = (pos > 0)                      ? this.tokens[pos - 1] : new Token();
        const nextToken = (pos + 1 < this.tokens.length) ? this.tokens[pos + 1] : new Token();

        if (prevToken.isLexemeEqualTo('@extend')) {
            this.tokens[pos].setType('selector').setClassName('hl-sel');
        } else if (prevToken.isLexemeEqualTo(['@keyframes', '@function', '@mixin', '@include'])) {
            this.tokens[pos].setType('function').setClassName('hl-f');
        } else if (nextToken.isLexemeEqualTo('(') && !this.isSelector(pos)) {
            this.tokens[pos].setType('function').setClassName('hl-f');
        } else if (nextToken.isLexemeEqualTo('=')) {
            this.tokens[pos].setType('attr').setClassName('hl-attr');
        } else if (prevToken.isLexemeEqualTo('=')) {
            this.tokens[pos].setType('value').setClassName('hl-val');
        } else if (this.isProperty(pos, nextToken)) {
            this.tokens[pos].setType('property').setClassName('hl-prop');
        } else if (this.isSelector(pos)) {
            this.tokens[pos].setType('selector').setClassName('hl-sel');
        }
    }

    private parseAsterisk(pos: number) {
        const prevToken = (pos > 0)                      ? this.tokens[pos - 1] : new Token();
        const nextToken = (pos + 1 < this.tokens.length) ? this.tokens[pos + 1] : new Token();
    
        if ((prevToken.isLexemeEqualTo(')') || prevToken.isTypeEqualTo(['variable', 'number'])) &&
            (nextToken.isTypeEqualTo(['variable', 'function', 'number']))) {
            return;
        } else {
            this.tokens[pos].setType('keyword2').setClassName('hl-k2');
        }
    }

    private parseCoron(pos: number) {
        const nextToken = (pos + 1 < this.tokens.length) ? this.tokens[pos + 1] : new Token();
        if (nextToken.isTypeEqualTo('coron'))    this.parseCoron(pos + 1);
        if (nextToken.isTypeEqualTo('selector')) this.tokens[pos].setType('selector').setClassName('hl-sel');
    }

    private isProperty(pos: number, nextToken: Token) {
        if (!nextToken.isTypeEqualTo('coron')) return false;

        const semicPos = this.tokens.findIndexByType('semic', pos);
        const lcurPos  = this.tokens.findIndexByLexeme('{', pos);
        
        return semicPos > 0 && semicPos < lcurPos || lcurPos < 0;
    }

    private isSelector(pos: number) {
        const lcurPos  = this.tokens.findIndexByLexeme('{', pos);
        const semicPos = this.tokens.findIndexByType('semic', pos);
        return lcurPos > 0 && lcurPos < semicPos || semicPos < 0;
    }
}