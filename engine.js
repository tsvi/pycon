// engine.js
module.exports = ({ marp }) =>
  marp.use(({ marpit }) => {
    const { highlighter } = marpit

    marpit.highlighter = function (code, lang, attrs) {
      const original = highlighter.call(this, code, lang, attrs)

      // Parse code highlight
      const matched = attrs.toString().match(/{([\d,-]+)}/)
      const lineNumbers = matched?.[1]
        .split(',')
        .map((v) => v.split('-').map((v) => parseInt(v, 10)))

      // Parse code title
      const titleMatch = attrs.toString().match(/title="([^"]+)"/);
      const title = titleMatch ? titleMatch[1] : '';

      // Include title if specified
      const titleHTML = title ? `<div class="code-title">${title}</div>` : '';

      // Parse no-line-number option
      const noLineNumbers = attrs.toString().match(/no-line-number/);

      // Apply line numbers
      if (!noLineNumbers) {
        const listItems = original
          .split(/\n(?!$)/) // Don't split at the trailing newline
          .map((line, index) => {
            const lineNum = index + 1

            const highlighted = lineNumbers?.find(([start, end]) => {
              if (end != null && start <= lineNum && lineNum <= end) return true

              return start === lineNum
            })

            return `<li${
              highlighted ? ' class="highlighted-line"' : ''
            }><span data-marp-line-number></span><span>${line}</span></li>`
          })

        return `${titleHTML}<ol>${listItems.join('')}</ol>`
      } else {
        return `${titleHTML}${original}`
      }
    }
  })