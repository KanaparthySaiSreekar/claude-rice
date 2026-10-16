// Lets Node load the mod's TypeScript the way the mod runtime does: relative imports without an extension
// ("./core") resolve to "./core.ts". Registered with `node --import ./tests/ts-resolve.mjs --test ...`.
import { registerHooks } from 'node:module'

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context)
    } catch (error) {
      const relative = specifier.startsWith('./') || specifier.startsWith('../')
      if (relative && !/\.[a-z]+$/i.test(specifier)) {
        try { return nextResolve(`${specifier}.ts`, context) } catch { /* fall through to the original error */ }
      }
      throw error
    }
  },
})
