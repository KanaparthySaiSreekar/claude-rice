// Read and write the Windows Terminal settings file (it allows comments and trailing commas,
// so strip those before JSON.parse) and merge palette artefacts into it safely.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

export const WT_SETTINGS = path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local"),
  "Packages", "Microsoft.WindowsTerminal_8wekyb3d8bbwe", "LocalState", "settings.json")
export const PREVIEW_GUID = "{7b1c9f10-0a15-4c0e-9e2b-0c1a55e5a001}"

/** Remove // and /* *\/ comments and trailing commas without touching string contents. */
export function stripJsonc(text) {
  let out = "", i = 0, inStr = false
  while (i < text.length) {
    const c = text[i], n = text[i + 1]
    if (inStr) { out += c; if (c === "\\") { out += n ?? ""; i += 2; continue } if (c === '"') inStr = false; i++; continue }
    if (c === '"') { inStr = true; out += c; i++; continue }
    if (c === "/" && n === "/") { while (i < text.length && text[i] !== "\n") i++; continue }
    if (c === "/" && n === "*") { i += 2; while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++; i += 2; continue }
    out += c; i++
  }
  return out.replace(/,(\s*[}\]])/g, "$1")
}

export const readWt = (file = WT_SETTINGS) => JSON.parse(stripJsonc(fs.readFileSync(file, "utf8")))
export const writeWt = (obj, file = WT_SETTINGS) => fs.writeFileSync(file, JSON.stringify(obj, null, 4) + "\n")

/** Insert or replace the item whose `key` matches. */
export function upsert(list, item, key = "name") {
  const i = list.findIndex((x) => x[key] === item[key])
  if (i >= 0) list[i] = item; else list.push(item)
  return list
}

/** A hidden profile for previews: leaves profiles.defaults and the global theme alone. */
export function addPreviewProfile(settings, { scheme, defaults, pwsh }) {
  settings.schemes = upsert(settings.schemes ?? [], scheme)
  settings.profiles.list = upsert(settings.profiles.list, {
    guid: PREVIEW_GUID, name: "rice-preview", hidden: true, commandline: pwsh, startingDirectory: "%USERPROFILE%", ...defaults,
  }, "guid")
  return settings
}

export function removePreviewProfile(settings) {
  settings.profiles.list = settings.profiles.list.filter((p) => p.guid !== PREVIEW_GUID)
  return settings
}
