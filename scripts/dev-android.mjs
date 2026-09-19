// Builds the native Android shell once, points its WebView at the local Vite
// dev server (via `adb reverse`), installs it on the USB-connected device and
// launches it. Requires `npm run dev` (Vite) to already be running/starting.
//
// Windows note: Capacitor CLI's own `cap run android` shells out to
// `./gradlew`, which fails on Windows (no extension resolution for the
// "./" prefix). This script drives gradlew.bat directly instead.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const androidDir = path.join(root, "android");
const assetsConfigPath = path.join(
  androidDir,
  "app",
  "src",
  "main",
  "assets",
  "capacitor.config.json",
);
const isWin = process.platform === "win32";
const gradlew = path.join(androidDir, isWin ? "gradlew.bat" : "gradlew");
const adb = path.join(
  process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT ?? "",
  "platform-tools",
  isWin ? "adb.exe" : "adb",
);
const port = process.env.CAP_DEV_PORT ?? "5173";

function run(cmd, cwd = root) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd, shell: true });
}

run("npx vite build");
run("npx cap sync android");

console.log("\n> patching android/app/src/main/assets/capacitor.config.json for live-reload");
const cfg = JSON.parse(readFileSync(assetsConfigPath, "utf-8"));
cfg.server = { url: `http://localhost:${port}`, cleartext: true };
writeFileSync(assetsConfigPath, JSON.stringify(cfg, null, 2));

run(`"${gradlew}" assembleDebug`, androidDir);

const appId = JSON.parse(readFileSync(path.join(root, "capacitor.config.json"), "utf-8")).appId;
const apkPath = path.join(androidDir, "app", "build", "outputs", "apk", "debug", "app-debug.apk");

run(`"${adb}" install -r "${apkPath}"`);
run(`"${adb}" reverse tcp:${port} tcp:${port}`);
run(`"${adb}" shell am start -n ${appId}/.MainActivity`);

console.log(
  `\nApp instalado e rodando no celular via USB.\nMantenha "npm run dev" aberto — ao salvar arquivos em src/, o app atualiza sozinho (live reload).\n`,
);
