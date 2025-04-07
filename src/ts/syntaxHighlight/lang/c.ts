import Syntaxhighlighter from '../base';
import Namespace from '../namespase';
import { Token } from '../token';
import { PatternList } from '../type';


const macroConstant = "EOF NULL sizeof stderr stdin stdout";
const alias = "FILE size_t";

const patternList: PatternList = {
    comment:       { regexp: /^(?:\/\/.*|\/\*[\s\S]*?\*\/|\/\*[\s\S]*)/,       className: 'hl-cm'  },
    for:           { regexp: /^for(?!\w)/,                                     className: 'hl-k1'  },
    keyword:       { regexp: /^(?:return|while|if|else|break|continue)(?!\w)/, className: 'hl-k1'  },
    define:        { regexp: /^#define/,                                       className: 'hl-pp'  },
    preprocessor:  { regexp: /^#(?:include|if|endif|ifdef|ifndef)/,            className: 'hl-pp'  },
    headerFile:    { regexp: /^(?:<.+\.h>)/,                                   className: 'hl-hf'  },
    typedef:       { regexp: /^typedef(?!\w)/,                                 className: 'hl-k2'  },
    struct:        { regexp: /^(?:struct|union)(?!\w)/,                        className: 'hl-k2'  },
    enum:          { regexp: /^enum(?!\w)/,                                    className: 'hl-k2'  },
    variableType:  { regexp: /^(?:int|float|double|char|void)(?!\w)/,          className: 'hl-vt'  },
    identifier:    { regexp: /^[A-Za-z_]\w*/,                                  className: null     },
    string:        { regexp: /^(["']).*?\1/,                                   className: 'hl-str' },
    number:        { regexp: /^(?:0x[0-9a-fA-F]+|[0-9]+(?:\.[0-9]+)?)\b/,      className: 'hl-n'   },
    memberRef:     { regexp: /^(?:\.|->)/,                                     className: null     },
    lcur:          { regexp: /^{/,                                             className: null     },
    rcur:          { regexp: /^}/,                                             className: null     },
    comma:         { regexp: /^,/,                                             className: null     },
    semic:         { regexp: /^;/,                                             className: null     },
};

export default class CHighlighter extends Syntaxhighlighter {
    nsStack:         Namespace;
    isStackedByFunc: boolean;
    isStackedByFor:  boolean;
    popAtWithSemic:  number[];

    constructor(src: string) {
        super(src, patternList);
        this.nsStack         = this.externDefine();
        this.isStackedByFunc = false;
        this.isStackedByFor  = false;
        this.popAtWithSemic  = [];

        this.nsStack.register(macroConstant, 'macro')  // match `type` and specifier of extern markdown (e.g.) %macro ...
                    .register(alias, 'alias');
    }

    parseTokens() {
        for (let i = 0; i < this.tokens.length; i++) {
            const token = this.tokens[i];
            switch (token.type) {
                case 'comment':      this.tokens[i].addTag('ignoreHighlightBrackets'); break;
                case 'define':       this.parseDefine(i);                              break;
                case 'typedef':      this.parseTypedef(i);                             break;
                case 'struct':       this.parseStruct(i);                              break;
                case 'enum':         this.parseEnum(i);                                break;
                case 'variableType': this.parseDeclaration(i);                         break;
                case 'identifier':   this.parseIdentifier(i);                          break;
                case 'lcur':         this.stackNamespace(i); break;
                case 'rcur':         this.popNamespace(i);       break;
            }
        }
        
        this.tokens.forEach(({ lexeme, type }, i) => {
            if (type === 'identifier') {
                if (this.nsStack.has(lexeme, 'function')) {
                    this.tokens[i].setType('function').setClassName('hl-f');
                } else {
                    this.tokens[i].setType('variable').setClassName('hl-v');
                }
            }
        });
// console.log(JSON.stringify(this.nsStack.getGlobalScope().toJSON()))
        this.highlightBrackets()
            .highlightEscapeSequence()
            .highlightConvertionSpecifier();
    }

    private parseFor() {
        // this.nsStack = this.nsStack.createChildScope();
        // this.isInForScope = true;        
    }

    private parseDefine(kwPos: number) {
        if (this.tokens.length <= kwPos + 1) return;
        
        const ident = this.tokens[kwPos + 1];
        this.tokens[kwPos + 1].setType('macroConstant').setClassName('hl-mc');
        this.nsStack.append(ident.lexeme, 'macro');
    }

    private parseTypedef(kwPos: number) {
        if (this.tokens.length <= kwPos + 1) return;
        
        const nextToken = this.tokens[kwPos + 1];
        const identPos = (nextToken.isTypeEqualTo(['struct', 'enum'])) 
            ? this.tokens.findIndexByType('rcur', kwPos) + 1
            : kwPos + 2
        if (this.tokens.length <= identPos) return;

        this.tokens[identPos].setType('alias').setClassName('hl-al');
        this.nsStack.append(this.tokens[identPos].lexeme, 'alias')
    }

    private parseStruct(kwPos: number) {
        const nextToken = (kwPos + 1 < this.tokens.length) ? this.tokens[kwPos + 1] : new Token();
        const followedByIdent = nextToken.isTypeEqualTo('identifier');
        if (followedByIdent) this.tokens[kwPos + 1].setType('alias').setClassName('hl-al');

        if (followedByIdent) {
            const nextnextToken = (kwPos + 2 < this.tokens.length) ? this.tokens[kwPos + 2] : new Token();
            if (nextnextToken.isTypeEqualTo('identifier') || nextnextToken.isLexemeEqualTo('*')) this.parseDeclaration(kwPos + 1);
        }
    }

    private parseEnum(kwPos: number) {
        const nextToken = (kwPos + 1 < this.tokens.length) ? this.tokens[kwPos + 1] : new Token();
        const followedByIdent = nextToken.isTypeEqualTo('identifier');
        if (followedByIdent) this.tokens[kwPos + 1].setType('alias').setClassName('hl-al');

        if (followedByIdent) {
            const nextnextToken = (kwPos + 2 < this.tokens.length) ? this.tokens[kwPos + 2] : new Token();
            if (nextnextToken.isTypeEqualTo('identifier') || nextnextToken.isLexemeEqualTo('*')) this.parseDeclaration(kwPos + 1);
        }

        const lcurPos = this.tokens.findIndexByType('lcur', kwPos);
        const isDeclaration = lcurPos !== -1 && lcurPos - kwPos <= 2;
        if (!isDeclaration) return;

        const from = lcurPos + 1;
        const to   = this.tokens.findIndexByType('rcur', kwPos) - 1;
        for (let i = from; i <= to; i++) {
            const token = this.tokens[i];
            if (token.isTypeEqualTo('identifier')) {
                this.tokens[i].setType('enumMember').setClassName('hl-en');
                this.nsStack.append(token.lexeme, 'enumMember');
            }
        }
    }

    private parseDeclaration(varTypePos: number) {
        let i: number;
        for (i = varTypePos + 1; i < this.tokens.length && this.tokens[i].isLexemeEqualTo('*'); i++);
        const isDeclaration = i < this.tokens.length && this.tokens[i].isTypeEqualTo('identifier');

        if (!isDeclaration) return;  // (e.g.) cast operation

        const isFunctionDeclaration = i + 1 < this.tokens.length && this.tokens[i + 1].isLexemeEqualTo('(');
        if (isFunctionDeclaration) {
            this.tokens[i].setType('function').setClassName('hl-f');
            this.nsStack.append(this.tokens[i].lexeme, 'function');
            const semicPos = this.tokens.findIndexByType('semic', i);
            const lcurPos  = this.tokens.findIndexByType('lcur',  i);
            if (lcurPos > 0 && (lcurPos < semicPos || lcurPos < 0)) {
                this.nsStack = this.nsStack.createChildScope(i);
                this.isStackedByFunc = true;
            }
            const rbraPos = this.tokens.findIndexByLexeme(')', i);
            for (let j = i + 2; j < rbraPos; j++) {
                const token     = this.tokens[j];
                const prevToken = this.tokens[j - 1];
                if (this.nsStack.has(token.lexeme, 'alias') && prevToken.isLexemeEqualTo(['(', ','])) {
                    this.tokens[j].setType('variableType').setClassName('hl-al');
                }
            }
        } else {
            this.parseDeclarationStat(varTypePos);
        }
    }

    private parseDeclarationStat(varTypePos: number) {
        const semicPos = this.tokens.findIndexByType('semic', varTypePos);
        const rbraPos  = this.tokens.findIndexByLexeme(')', varTypePos);  // For function definition

        const from = varTypePos + 1;
        const to   = Math.min(semicPos, rbraPos) - 1;
        for (let i = from; i <= to; i++) {
            const token     = this.tokens[i];
            const prevToken = this.tokens[i - 1];
            if (token.isTypeEqualTo('identifier') && (prevToken.isTypeEqualTo('comma') || prevToken.isLexemeEqualTo('*') || i === from)) {
                this.nsStack.append(token.lexeme, 'variable');
                this.tokens[i].setType('variable').setClassName('hl-v');
            }
        }
    }

    private parseIdentifier(pos: number) {
        const token     = this.tokens[pos];
        const prevToken = (pos > 0)                      ? this.tokens[pos - 1] : new Token();
        const nextToken = (pos + 1 < this.tokens.length) ? this.tokens[pos + 1] : new Token();

        if (this.nsStack.has(token.lexeme, 'macro')) {
            this.tokens[pos].setType('macroConstant').setClassName('hl-mc');
        } else if (this.nsStack.has(token.lexeme, 'enumMember')) {
            this.tokens[pos].setType('enumMember').setClassName('hl-en');
        } else if (prevToken.isTypeEqualTo('memberRef')) {
            this.tokens[pos].setType('structMember').setClassName('hl-v');
        } else if (this.nsStack.has(token.lexeme, 'alias')) {
            this.parseAlias(pos);  // determine if it is variable or alias
        } else if (nextToken.isLexemeEqualTo('(')) {
            this.tokens[pos].setType('function').setClassName('hl-f');
        }
    }

    private parseAlias(aliasPos: number) {
        const prevprevToken = (aliasPos - 1 > 0)                  ? this.tokens[aliasPos - 2] : new Token();
        const prevToken     = (aliasPos > 0)                      ? this.tokens[aliasPos - 1] : new Token();
        const nextToken     = (aliasPos + 1 < this.tokens.length) ? this.tokens[aliasPos + 1] : new Token();

        if ((!prevToken.isTypeEqualTo('other') || aliasPos === 0) &&  // NOT operator, left-bracket, etc...
            (nextToken.isTypeEqualTo('identifier') || nextToken.isLexemeEqualTo('*'))) {  // variable declaration
            this.tokens[aliasPos].setType('alias').setClassName('hl-al');
            this.parseDeclaration(aliasPos);
        } else if (prevprevToken.isLexemeEqualTo('sizeof') && this.nsStack.getTypeByName(this.tokens[aliasPos].lexeme) === 'alias') {  // operand of sizeof()
            this.tokens[aliasPos].setType('alias').setClassName('hl-al');
        } else if (prevToken.isLexemeEqualTo('(')) {  // cast operation
            let i: number;
            for (i = aliasPos + 1; i < this.tokens.length && this.tokens[i].isLexemeEqualTo('*'); i++);
            if (i + 1 >= this.tokens.length) return;
            if (this.tokens[i].isLexemeEqualTo(')') && this.tokens[i + 1].isTypeEqualTo(['identifier'])) 
                this.tokens[aliasPos].setType('alias').setClassName('hl-al');
        } 
    }

    private stackNamespace(pos: number) {
        if (this.isStackedByFunc) {
            this.isStackedByFunc = false;
            return;
        }
        if (this.isStackedByFor) {
            this.isStackedByFor = false;
            return;
        }
        this.nsStack = this.nsStack.createChildScope(pos);
    }

    private popNamespace(pos: number) {
        if (this.popAtWithSemic.length) return;
        this.nsStack = this.nsStack.escapeScope(pos);
    }
}