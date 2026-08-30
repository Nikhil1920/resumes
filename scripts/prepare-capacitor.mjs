import { copyFile, access } from "node:fs/promises"
import { resolve } from "node:path"

const clientDir = resolve("build", "client")
const shellPath = resolve(clientDir, "_shell.html")
const indexPath = resolve(clientDir, "index.html")

await access(shellPath)
await copyFile(shellPath, indexPath)
