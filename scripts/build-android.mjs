// Builds a standalone, production-pointed debug APK (no dev-server / live-reload
// wiring — it loads the app straight from the files bundled inside the APK).
// Uses the same gradlew.bat-via-absolute-path fix as scripts/dev-android.mjs,
// since Windows can't resolve the bare/relative "gradlew" the Capacitor CLI
// and naive "cd android && gradlew" scripts rely on.
import { execSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const androidDir = path.join(root, "android");
const isWin = process.platform === "win32";
const gradlew = path.join(androidDir, isWin ? "gradlew.bat" : "gradlew");

function run(cmd, cwd = root) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd, shell: true });
}

run("npx vite build");
run("npx cap sync android");
run(`"${gradlew}" assembleDebug`, androidDir);

const apkPath = path.join(androidDir, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
console.log(`\nAPK gerado em: ${apkPath}\n`);
