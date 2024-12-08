import '@/styles/reset.css';
import '@/styles/base.css';
import '@/styles/style.css';
import Syntaxhighlight from "./syntaxHighlight";
import HTMLHighlight from "./lang/html";

const selectBox = <HTMLInputElement>document.getElementById('select');
const codeArea  = <HTMLInputElement>document.getElementById('code');
const textArea  = <HTMLInputElement>document.getElementById('txt');

function codeHighlight() {
    const lang = selectBox.value;
    const src  = textArea.value;
    let highlighter: Syntaxhighlight;

    switch (lang) {
        case 'html': highlighter = new HTMLHighlight(src); break;
        default:     highlighter = new HTMLHighlight(src);
    }

    codeArea.innerHTML = highlighter.getHighlightedSrc();
}

selectBox.addEventListener('change', codeHighlight);
textArea.addEventListener('input', codeHighlight);