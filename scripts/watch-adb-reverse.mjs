// Keeps `adb reverse` alive across USB reconnects/replugs. Every USB
// re-enumeration creates a new adb "transport" and silently drops all
// reverse port forwards, which makes the app on the phone show
// ERR_CONNECTION_REFUSED even though the dev server is fine. This just
// re-applies the forward whenever it's missing.
import { execSync } from "node:child_process";
import path from "node:path";

const isWin = process.platform === "win32";
const adb = path.join(
  process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT ?? "",
  "platform-tools",
  isWin ? "adb.exe" : "adb",
);
const port = process.env.CAP_DEV_PORT ?? "5173";
const rule = `tcp:${port} tcp:${port}`;

function currentReverses() {
  try {
    return execSync(`"${adb}" reverse --list`, { encoding: "utf-8" });
  } catch {
    return "";
  }
}

function ensureReverse() {
  if (!currentReverses().includes(rule)) {
    try {
      execSync(`"${adb}" reverse ${rule}`, { stdio: "ignore" });
      console.log(`[usb-watch] adb reverse ${rule} (re)applied`);
    } catch {
      // device not connected right now; try again on the next tick
    }
  }
}

console.log(`[usb-watch] watching adb reverse ${rule} — keep this running while developing`);
ensureReverse();
setInterval(ensureReverse, 2000);
