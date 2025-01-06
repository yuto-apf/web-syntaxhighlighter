import Syntaxhighlight from '../base';
import { Token, PatternList } from '../type';


const patternLists: { [key: string]: PatternList } = {
    comment:      { pattern: /^(?:\/\/.*|\/\*[\s\S]*?\*\/|\/\*[\s\S]*)/,                             className: 'hl-cm'  },
    define:       { pattern: /^#define/,                                                             className: 'hl-pp'  },
    preprocessor: { pattern: /^#(?:include|if|endif|ifdef|ifndef)/,                                  className: 'hl-pp'  },
    headerFile:   { pattern: /^(?:<.+\.h>)/,                                                         className: 'hl-hf'  },
    keyword1:     { pattern: /^(?:return|for|while|if|else)(?!\w)/,                                  className: 'hl-k1'  },
    keyword2:     { pattern: /^(?:typedef|struct|enum|union|sizeof|NULL|stdin|stdout|stderr)(?!\w)/, className: 'hl-k2'  },
    variableType: { pattern: /^(?:int|float|double|char|void)(?!\w)/,                                className: 'hl-vt'  },
    identifier:   { pattern: /^[A-Za-z_]\w*/,                                                        className: null     },
    string:       { pattern: /^(["']).*?\1/,                                                         className: 'hl-str' },
    number:       { pattern: /^(?:0x[0-9a-fA-F]+|[0-9]+(?:\.[0-9]+)?)\b/,                            className: 'hl-n'   },
};

export default class CHighlight extends Syntaxhighlight {
    nameSpaces:number[];

    constructor(src: string) {
        super(src, patternLists);
        this.nameSpaces = [];
    }

    parseTokens() {
        const newTokens: Token[] = [];
        
        let i = 0;
        while (i < this.tokens.length) {
            const token = this.tokens[i];

            switch (token.type) {
                case 'comment':   newTokens.push({ ...token, tag: ['ignoreHighlightBrackets'] }); break;
                case 'define':    this.parseDefine(i);

                default:          newTokens.push(token);
            }

            i++;
        }

        this.tokens.forEach(token => {
            switch (token.type) {
                case 'comment':   newTokens.push({ ...token, tag: ['ignoreHighlightBrackets'] }); break;

                default:          newTokens.push(token);
            }
        });

        this.tokens = this.highlightEscapeSequence(newTokens);
        this.tokens = this.highlightBrackets(this.tokens);
    }

    private parseDefine(pos: number) {
        const ident = this.tokens[pos + 1];
        this.tokens[pos + 1] = {...ident, type: 'macroConstant', className: 'hl-mc' };
    }
}