// rice.mjs: v3's CLI. All the work is in kit.mjs (shared by v3 to v6); version.json says what v3 switches.
import path from "node:path"
import { fileURLToPath } from "node:url"
import { cli } from "./kit.mjs"

cli(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), process.argv.slice(2))
