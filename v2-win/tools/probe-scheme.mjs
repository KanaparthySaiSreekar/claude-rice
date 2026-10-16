// probe-scheme.mjs: add (or remove) a throwaway Windows Terminal scheme whose 16 ANSI slots are all vivid,
// distinct hues, and point the hidden rice-preview profile at it. Whatever colour a UI element takes in a
// screenshot then tells you which ANSI slot it follows. Used to find what the flightdeck pane background maps to.
//   node tools/probe-scheme.mjs on | off [palette]
import { readWt, writeWt, upsert, PREVIEW_GUID } from "./lib/wt.mjs"
import { getPalette } from "./lib/palette.mjs"
import { PALETTES } from "./rice.mjs"

const PROBE = {
  name: "rice-probe", background: "#101010", foreground: "#F0F0F0", cursorColor: "#FFFFFF", selectionBackground: "#404040",
  black: "#000000", red: "#FF0000", green: "#00C000", yellow: "#FFFF00", blue: "#0000FF", purple: "#FF00FF", cyan: "#00FFFF", white: "#FFFFFF",
  brightBlack: "#808080", brightRed: "#FF8080", brightGreen: "#80FF80", brightYellow: "#FFFF80", brightBlue: "#8080FF", brightPurple: "#FF80FF", brightCyan: "#80FFFF", brightWhite: "#E0E0E0",
}
const [mode, palette] = process.argv.slice(2)
const s = readWt()
const preview = s.profiles.list.find((p) => p.guid === PREVIEW_GUID)
if (!preview) throw new Error("no rice-preview profile: run `node tools/rice.mjs preview-install` first")
if (mode === "on") {
  s.schemes = upsert(s.schemes, PROBE); preview.colorScheme = "rice-probe"; console.log("probe scheme on")
} else if (mode === "off") {
  s.schemes = s.schemes.filter((x) => x.name !== "rice-probe"); preview.colorScheme = getPalette(PALETTES, palette).label; console.log("probe scheme off")
} else { console.log("usage: node tools/probe-scheme.mjs on|off [palette]"); process.exit(1) }
writeWt(s)
