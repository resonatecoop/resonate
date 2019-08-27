# Fonts

```html
...
<link rel="preload" as="font" crossorigin="" href="https://static.resonate.is/fonts/Graphik-Regular.woff2">
...
```

```css
@font-face {
  font-family: 'Graphik';
  src: url('https://static.resonate.is/fonts/Graphik-Semibold.eot');
  src: url('https://static.resonate.is/fonts/Graphik-Semibold.eot?#iefix') format('embedded-opentype'),
  url('https://static.resonate.is/fonts/Graphik-Semibold.woff2') format('woff2'),
  url('https://static.resonate.is/fonts/Graphik-Semibold.woff') format('woff');
  font-weight: 600;
  font-style: normal;
  font-stretch: normal;
  font-display: swap;
}
```

## Notes

If you add fonts inside `beta/assets`, bankai will automatically load them.

## See also

- [Webfont Optimization](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/webfont-optimization)
- [@resonate/tachyons/src/utilities/_fonts.css](/packages/tachyons/src/utilities/_fonts.css)
