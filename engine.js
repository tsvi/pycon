// engine.js

const { Marp } = require('@marp-team/marp-core')
const Prism = require('prismjs');

const loadLanguages = require('prismjs/components/');

// Load the plugins you want to use
require('prismjs/plugins/line-numbers/prism-line-numbers');
require('prismjs/plugins/line-highlight/prism-line-highlight');

loadLanguages(['python', 'jinja2', 'toml']);

function extractLineHighlight(attrs) {
  const matched = attrs.toString().match(/{([\d,-]+)}/)
  const lineNumbers = matched?.[1]
    .split(',')
    .map((v) => v.split('-').map((v) => parseInt(v, 10)))  
  return lineNumbers;
}

module.exports = (opts) => {
  const marp = new Marp(opts)
  marp.highlighter = (code, lang, attrs) => {
    const highlight = extractLineHighlight(attrs);
    const languageConfig = Prism.languages[lang] || Prism.languages.plaintext;
    let highlightedCode = Prism.highlight(code, languageConfig, lang);

    // Add line numbers
    let preTag = `<pre class="language-${lang} line-numbers"`;

    // Add line highlight if specified
    if (highlight) {
      preTag += ` data-line="${highlight}"`;
    }

    preTag += `><code>${highlightedCode}</code></pre>`;

    return preTag;
  }
  return marp
}