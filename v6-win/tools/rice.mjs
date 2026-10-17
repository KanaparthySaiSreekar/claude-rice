// rice.mjs: v6's CLI. The work is in v3-win/tools/kit.mjs (shared by v3 to v6); version.json says what v6 switches.
import path from "node:path"
import { fileURLToPath } from "node:url"
import { cli } from "../../v3-win/tools/kit.mjs"

cli(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), process.argv.slice(2))
