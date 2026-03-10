module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    'postcss-prefix-selector': {
      prefix: '#mjrsRoot',
      transform(prefix, selector, prefixedSelector) {
        if (selector === ':root' || selector === ':host') return prefix;
        if (selector === 'body') return selector;
        return prefixedSelector;
      },
    },
  },
}
