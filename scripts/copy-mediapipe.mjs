import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.resolve(__dirname, "../node_modules/@mediapipe/tasks-vision/wasm");
const targetDir = path.resolve(__dirname, "../public/mediapipe/wasm");

try {
  if (!fs.existsSync(sourceDir)) {
    console.warn(`[copy-mediapipe] Sumber tidak ditemukan di ${sourceDir}. Melewati penyalinan.`);
    process.exit(0);
  }

  fs.mkdirSync(targetDir, { recursive: true });

  const files = fs.readdirSync(sourceDir);
  let copiedCount = 0;

  for (const file of files) {
    const srcFile = path.join(sourceDir, file);
    const destFile = path.join(targetDir, file);
    const stat = fs.statSync(srcFile);

    if (stat.isFile()) {
      fs.copyFileSync(srcFile, destFile);
      copiedCount++;
    }
  }

  console.log(`[copy-mediapipe] Berhasil menyalin ${copiedCount} file wasm ke ${targetDir}`);
} catch (err) {
  console.error(`[copy-mediapipe] Gagal menyalin file wasm:`, err);
  process.exit(1);
}
