// engine.js

const { Marp } = require('@marp-team/marp-core')
const highlightLines = require('markdown-it-highlight-lines')

module.exports = ({ marp }) =>
    marp.use(highlightLines,({ marpit }) => {
      const { highlighter } = marpit
  
      marpit.highlighter = function (...args) {
        const original = highlighter.apply(this, args)
        const listItems = original
          .split(/\n(?!$)/) // Don't split at the trailing newline
          .map(
            (line) =>
              `<li><span data-marp-line-number></span><span>${line}</span></li>`
          )
  
        return `<ol>${listItems.join('')}</ol>`
      }
    })