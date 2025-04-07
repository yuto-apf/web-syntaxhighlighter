import { PatternList } from './type';
import { Token, TokenArray } from './token';
import { mod } from '../helper';
import Namespace from './namespase';


export default abstract class Syntaxhighlighter {
    private src: string;
    tokens: TokenArray;

    constructor(src: string, patternList: PatternList ) {
        this.src    = src;
        this.tokens = this.lexicalAnalysis(src, patternList);
    }

    abstract parseTokens(): void;

    lexicalAnalysis(src: string, patternList: PatternList, includeWhiteSpace = false) {
        const tokens = new TokenArray();
        patternList = {
            ...patternList,
            externSep:  { regexp: /^%==/, className: null }, 
            other:      { regexp: /^\S/,  className: null },
            whiteSpace: { regexp: /^\s+/, className: null }
        };

        while (src) {
            for (const type in patternList) {
                const match = src.match(patternList[type].regexp);
                if (match) {
                    const lexeme = match[0];
                    src = src.slice(lexeme.length);
                    if (type === 'whiteSpace' && !includeWhiteSpace) continue;
                    tokens.push(new Token({
                        lexeme:    lexeme,
                        type:      type,
                        className: patternList[type].className
                    }));
                    break;
                }
            }
        }
        return tokens;
    }

    generateHTML() {
        this.parseTokens();

        let highlightedSrc = '';
        let i = 0;
        
    // console.log(this.tokens)
    // console.log(this.src)
        
        this.src = this.src.trim();
        this.tokens.forEach(({ lexeme, className }) => {
            const lexFrom = this.src.indexOf(lexeme, i);

            if (i < lexFrom) highlightedSrc += this.src.slice(i, lexFrom);
            highlightedSrc += className
                ? `<span class='${className}'>${this.escape(lexeme)}</span>`
                : this.escape(lexeme);
                
            i = lexFrom + lexeme.length;
        });
        if (i < this.src.length) {
            highlightedSrc += this.src.slice(i);
        }

        return highlightedSrc;
    }

    externDefine() {
        const match = this.src.match(/^%==\n([\s\S]*)\n%==/);
        if (!match) return new Namespace();

        const ns    = new Namespace();
        const rules = match[1].split('\n');
        for (let i = 0; i < rules.length; i++) {
            let rule = rules[i];
            if (!rule.startsWith('%')) continue;

            for (let j = i + 1; j < rules.length; j++) {
                if (rules[j].startsWith('%')) break;
                rule = rule.concat(' ', rules[j]);
            }

            const match = rule.match(/%(\S+)\s+([\s\S]*)/);
            if (!match) continue;
            ns.register(match[2], match[1]);
        }

        // If you make the markdown visible, you comment out these code below.
        this.src = this.src.slice(match[0].length);
        this.tokens.shift();
        while (!this.tokens.shift()?.isTypeEqualTo('externSep'));
            
        return ns;
    }

    highlightBrackets() {
        const includesOpenBracket = (lex: string) => {
            return lex.includes('(') || lex.includes('{') || lex.includes('[')
                ? true
                : false
        }
        const includesCloseBracket = (lex: string) => {
            return lex.includes(')') || lex.includes('}') || lex.includes(']')
                ? true
                : false
        }

        let bracketNest = 0;
        this.tokens.forEach((token, i) => {
            if (token.hasTag('ignoreHighlightBrackets')) return;
            if (includesOpenBracket(token.lexeme)) {
                bracketNest = mod(bracketNest, 3) + 1;
                this.tokens[i].setClassName(`hl-b-${bracketNest}`);
            }
            if (includesCloseBracket(token.lexeme)) {
                this.tokens[i].setClassName(`hl-b-${bracketNest}`);
                bracketNest = bracketNest - 1 || 3;
            }
        });

        return this;
    }

    highlightEscapeSequence() {
        const patternList: PatternList = {
            escapeSequence: { regexp: /^\\(?:[0-9a-fA-F]{4}|\S)/, className: 'hl-es' },
        }

        for (let i = 0; i < this.tokens.length; i++) {
            const token = this.tokens[i];
            if (token.isTypeEqualTo('string')) this.tokens.replace(i, this.parseString(token.lexeme, patternList));
        }

        return this;
    }

    highlightConvertionSpecifier() {
        const patternList: PatternList = {
            conversionSpecifier: { regexp: /^(?:%[-+ #0]*(?:0|[1-9][0-9]*)?(?:\.(?:0|[1-9][0-9]*)?)?(?:h{1,2}|l{1,2}|[Ljzt])?[diuoxXfFgGeEpcs%])/g, className: 'hl-cs' },
        }

        for (let i = 0; i < this.tokens.length; i++) {
            const token = this.tokens[i];
            if (token.isTypeEqualTo('string')) this.tokens.replace(i, this.parseString(token.lexeme, patternList));
        }

        return this;
    }

    private parseString(lex: string, patternList: PatternList) {
        const margeTokens = (tokens: Token[]) => {
            const margedTokens = new TokenArray();
            let lexeme    = tokens[0].lexeme;
            let type      = tokens[0].type;
            let className = tokens[0].className;

            for (let i = 1; i < tokens.length; i++) {
                const token = tokens[i];
                if (type === token.type) {
                    lexeme += token.lexeme;
                } else {
                    margedTokens.push(new Token({ lexeme, type, className }));
                    lexeme    = token.lexeme;
                    type      = token.type;
                    className = token.className
                }
            }
            if (type === tokens[tokens.length - 1].type) margedTokens.push(new Token({ lexeme, type, className }));

            return margedTokens;
        }

        const tokens = this.lexicalAnalysis(lex, patternList, true).map(token => {
            if (token.type === 'other')           token.setType('string').setClassName('hl-str');
            else if (token.type !== 'whiteSpace') token.setType(token.type).setClassName(token.className);

            return token;
        });

        return margeTokens(tokens);
    }

    private escape(str: string) {
        return str.replace(/</g,  '&lt;')
                  .replace(/>/g,  '&gt;')
                  .replace(/\$/g, '&#036;')
                  .replace(/"/g,  '&quot;')
                  .replace(/'/g,  '&#39;')
                  .replace(/`/g,  '&#096;');
    }
}