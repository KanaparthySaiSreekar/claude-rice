## The code

```js
export const bar = (pct, ramp = palette.ramp) => gradientBar(pct, 14, ramp)
const label = "context " + pct + "%"   // shown beside the bar
```

```mermaid
xychart-beta
  title "Refresh time (ms)"
  x-axis [v1, v2, v2.2, v3]
  bar [155, 170, 40, 38]
```

> [!NOTE]
> Run `npm test` in **v3-win** before applying.

- [x] ramp colours
- [x] two cells shorter
- [ ] a `sunset` palette
