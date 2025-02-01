import Syntaxhighlighter from '../base';


export default class BashHighlighter extends Syntaxhighlighter {
    constructor(src: string) {
        super(src, {});
    }

    parseTokens() {}
}