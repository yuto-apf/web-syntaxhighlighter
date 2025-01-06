import '@fortawesome/fontawesome-free/js/fontawesome';
import '@fortawesome/fontawesome-free/js/solid';
import '@fortawesome/fontawesome-free/js/regular';
import '@fortawesome/fontawesome-free/css/all.css';
import '@/styles/reset.css';
import '@/styles/style.scss';
import '@/styles/bg.scss';
import '@/ts/extentions/ArrayExtentions';
import '@/ts/extentions/StringExtentions';
import bgAnime from './bgAnime';
import Syntaxhighlight from '@/ts/syntaxHighlight/base';
import BashHighlight   from '@/ts/syntaxHighlight/lang/bash';
import HTMLHighlight   from '@/ts/syntaxHighlight/lang/html';
import SCSSHighlight   from '@/ts/syntaxHighlight/lang/scss';
import CHighlight      from '@/ts/syntaxHighlight/lang/c';


(() => {
    const langBtn    = <HTMLElement>document.getElementById('lang-btn');
    const langList   = <HTMLCollectionOf<Element>>document.getElementsByClassName('item');
    const langRadios = <NodeListOf<HTMLInputElement>>document.getElementsByName('lang');
    const langConfig = <HTMLElement>document.getElementById('config-popup');
    const lineNum    = <HTMLElement>document.getElementById('line-num');
    const code       = <HTMLInputElement>document.getElementById('code');
    const text       = <HTMLInputElement>document.getElementById('text');

    let isOpenLangConfig = false;
    let currentLang = 'c';

    const toggleLangConfig = () => {
        langConfig.classList.remove(isOpenLangConfig ? 'open' : 'close');
        langConfig.classList.add(isOpenLangConfig ? 'close' : 'open');
        isOpenLangConfig = !isOpenLangConfig;
    }

    const initRadio = () => {
        const defaultRadio = <HTMLInputElement>document.getElementById(currentLang);
        const defaultLabel = defaultRadio.parentElement;
        if (defaultRadio && defaultLabel) {
            defaultRadio.checked = true;
            defaultLabel.classList.add('checked');
        }
    }

    const modifyHeaderLangName = (lang: string) => {
        currentLang = lang;
        langBtn.classList.remove(...langBtn.classList);
        langBtn.classList.add(lang);
        switch (lang) {
            case 'bash': langBtn.innerText = 'Bash'; break;
            case 'html': langBtn.innerText = 'HTML'; break;
            case 'css':  langBtn.innerText = 'CSS';  break;
            case 'scss': langBtn.innerText = 'SCSS'; break;
            case 'c':    langBtn.innerText = 'C';    break;
        }
    }

    const synchronizeScroll = () => {
        code.scrollTop    = text.scrollTop;
        code.scrollLeft   = text.scrollLeft;
        lineNum.scrollTop = text.scrollTop;
    }

    function codeHighlight() {
        const src  = text.value;
        let highlighter: Syntaxhighlight;

        switch (currentLang) {
            case 'bash': highlighter = new BashHighlight(src); break;
            case 'html': highlighter = new HTMLHighlight(src); break;
            case 'scss': highlighter = new SCSSHighlight(src); break;
            case 'css' : highlighter = new SCSSHighlight(src); break;
            case 'c'   : highlighter = new CHighlight(src);    break;
            default:     highlighter = new BashHighlight(src);
        }
        const highlightedSrc = highlighter.getHighlightedSrc();
        const lineNumCnt = (highlightedSrc.match(/\n/g) || []).length + 1;
        while (lineNum.firstChild) {
            lineNum.removeChild(lineNum.firstChild);
        }
        [...Array(lineNumCnt)].forEach((_, i) => {
            const line = document.createElement('span');
            line.innerHTML = `${i + 1}.`;
            lineNum.appendChild(line);
        });
        code.innerHTML = highlightedSrc;
        // console.log(highlightedSrc)
    }

    document.addEventListener('DOMContentLoaded', () => {
        initRadio();
        modifyHeaderLangName(currentLang);
        codeHighlight();  // To appear the first line number.
        bgAnime();
    });

    langBtn.addEventListener('click', toggleLangConfig);

    [...langList].forEach((elm, i) => {
        elm.addEventListener('click', () => {
            const radio = langRadios[i];
            [...langList].forEach(elm => {
                elm.classList.remove('checked');
            });
            if (radio.checked) {
                langList[i].classList.add('checked');
                modifyHeaderLangName(radio.id);
            }
            codeHighlight();
        });
    });

    text.addEventListener("scroll", synchronizeScroll);
    text.addEventListener('input', () => {
        codeHighlight();
    });
    text.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const startPos = text.selectionStart ?? 0;
            const endPos   = text.selectionEnd ?? 0;
            const newPos = startPos + 1;
            const val = text.value;
            const head = val.slice(0, startPos);
            const foot = val.slice(endPos);
            text.value = `${head}\t${foot}`;
            text.setSelectionRange(newPos, newPos);
        }
        codeHighlight();
    });
})();