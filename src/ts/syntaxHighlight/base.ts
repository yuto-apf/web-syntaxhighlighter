import { Token, ClassName, PatternList } from './type';
import { mod } from '../helper';
 
export default abstract class Syntaxhighlight {
    src:    string;
    tokens: Token[];

    constructor(src: string, patternLists: { [key: string]: PatternList }) {
        this.src    = src;
        this.tokens = this.lexicalAnalysis(src, patternLists);
    }

    lexicalAnalysis(src: string, patternLists: { [key: string]: PatternList }) {
        const tokens: Token[] = [];
        patternLists = {
            ...patternLists,
            other:      { pattern: /^\S/,  className: null },
            whiteSpace: { pattern: /^\s+/, className: null }
        };

        while (src) {
            for (const type in patternLists) {
                const match = src.match(patternLists[type].pattern);
                if (match) {
                    const lexeme = match[0];
                    src = src.slice(lexeme.length);
                    if (type !== 'whiteSpace') {
                        tokens.push({
                            lexeme:    lexeme,
                            type:      type,
                            className: patternLists[type].className
                        });
                    }
                    break;
                }
            }
        }
        return tokens;
    }

    highlightBrackets(tokens: Token[]) {
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

        tokens.forEach((token, i) => {
            if (token.tag?.includes('ignoreHighlightBrackets')) return;
            if (includesOpenBracket(token.lexeme)) {
                bracketNest = mod(bracketNest, 3) + 1;
                tokens[i].className = `hl-b-${bracketNest}`;
            }
            if (includesCloseBracket(token.lexeme)) {
                tokens[i].className = `hl-b-${bracketNest}`;
                bracketNest = bracketNest - 1 || 3;
            }
        });

        return tokens;
    }

    highlightEscapeSequence(tokens: Token[]) {
        const parseString = (lex: string) => {
            const patternLists: { [key: string]: PatternList } = {
                es: { pattern: /^\\(?:[0-9a-fA-F]{4}|\S)/, className: 'hl-es' },
            }
            const tokens = this.lexicalAnalysis(lex, patternLists);

            return this.lexicalAnalysis(lex, patternLists).map(token => ({
                ...token,
                className: token.type === 'other' ? 'hl-str' : 'hl-es',
            }));
        }

        const newTokens: Token[] = [];
        
        tokens.forEach(token => {
            if (token.type === 'string') newTokens.push(...parseString(token.lexeme));
            else                         newTokens.push(token);
        });

        return newTokens;
    }

    replaceTokens(pos: number, tokens: Token[]) {
        this.tokens.splice(pos, 1, ...tokens);
    }

    modifyTokenClassName(pos: number, className: ClassName) {
        this.tokens[pos].className = className;
    }

    getHighlightedSrc() {
        this.parseTokens();

        let highlightedSrc = '';
        let i = 0;
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

    abstract parseTokens(): void;

    private escape(str: string) {
        return str.replace(/</g,  '&lt;')
                  .replace(/>/g,  '&gt;')
                  .replace(/\$/g, '&#036;')
                  .replace(/"/g,  '&quot;')
                  .replace(/'/g,  '&#39;')
                  .replace(/`/g,  '&#096;');
    }
}