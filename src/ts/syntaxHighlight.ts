import { Token, ClassName, PatternList } from './type';
import { mod } from './helper';
 
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

    highlightBrackets() {
        let bracketNest = 0;

        this.tokens.forEach((token, i) => {
            if (token.type === 'bracketOpen') {
                bracketNest = mod(bracketNest, 3) + 1
                this.modifyTokenClassName(i, `hl-b-${bracketNest}`);
            } 
            if (token.type === 'bracketClose') {
                this.modifyTokenClassName(i, `hl-b-${bracketNest}`);
                bracketNest = bracketNest - 1 || 3;
            }
        });
    }

    replaceTokens(pos: number, tokens: Token[]) {
        this.tokens.splice(pos, 1, ...tokens);
    }

    modifyTokenClassName(pos: number, className: ClassName) {
        this.tokens[pos].className = className;
    }

    getHighlightedSrc() {
        // let highlightedSrc = '';

        // this.parseTokens();

        // // let start = 0;
        // this.tokens.forEach(({ lexeme, className }) => {
        //     highlightedSrc += className ? `<span class='${className}'>${this.escape(lexeme)}</span>` : lexeme;
        //     // const replacement = className ? `<span class='${className}'>${this.escape(lexeme)}</span>` : this.escape(lexeme);
        //     // console.log(this.src.slice(start))
        //     // this.src = this.src.replaceFrom(start, lexeme, replacement);
        //     // start += replacement.length || lexeme.length;
        // });

        // return highlightedSrc;
        // // console.log(this.tokens)
        // // console.log(this.src)
        // // return this.src;

        this.parseTokens();

        let highlightedSrc = '';
        let i = 0;
        this.tokens.forEach(({ lexeme, className }) => {
            const lexFrom = this.src.indexOf(lexeme, i);
            if (i < lexFrom) {
                // src のうち、未処理の部分（ホワイトスペースなど）を追加
                highlightedSrc += this.src.slice(i, lexFrom);
            }

            // トークンをハイライト
            highlightedSrc += className
                ? `<span class='${className}'>${this.escape(lexeme)}</span>`
                : this.escape(lexeme);

            // src の処理済み部分を進める
            i = lexFrom + lexeme.length;
        });

        // 残りの未処理部分を追加
        // if (i < this.src.length) {
        //     highlightedSrc += this.src.slice(i);
        // }
        console.log(highlightedSrc)
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