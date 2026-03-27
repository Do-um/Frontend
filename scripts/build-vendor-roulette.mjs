import { execSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const rootDir = process.cwd()
const vendorDir = join(rootDir, "_vendor", "lazygyu-roulette")
const vendorNodeModulesDir = join(vendorDir, "node_modules")
const vendorLicensePath = join(vendorDir, "LICENSE")
const outputDir = join(rootDir, "public", "vendor", "roulette")
const outputLicensePath = join(outputDir, "LICENSE.txt")
function runNpm(args, cwd) {
  const command = process.platform === "win32" ? `npm.cmd ${args.join(" ")}` : `npm ${args.join(" ")}`

  execSync(command, {
    cwd,
    stdio: "inherit",
  })
}

if (!existsSync(vendorNodeModulesDir)) {
  runNpm(["install"], vendorDir)
}

runNpm(["run", "build:embed"], vendorDir)

mkdirSync(outputDir, { recursive: true })

const vendorLicense = readFileSync(vendorLicensePath, "utf8")
const licenseNotice = `lazygyu/roulette
Source: https://github.com/lazygyu/roulette
License: MIT

${vendorLicense}`

writeFileSync(outputLicensePath, licenseNotice, "utf8")
