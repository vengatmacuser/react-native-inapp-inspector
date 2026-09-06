const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const DIST_DIR = path.resolve(__dirname, '../dist');

async function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let totalSavedBytes = 0;
  let totalOriginalBytes = 0;
  let filesCount = 0;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const sub = await processDirectory(fullPath);
      totalSavedBytes += sub.totalSavedBytes;
      totalOriginalBytes += sub.totalOriginalBytes;
      filesCount += sub.filesCount;
    } else if (entry.isFile()) {
      if (entry.name.endsWith('.js')) {
        const originalCode = fs.readFileSync(fullPath, 'utf8');
        const origSize = Buffer.byteLength(originalCode, 'utf8');
        totalOriginalBytes += origSize;

        try {
          const result = await esbuild.transform(originalCode, {
            loader: 'jsx',
            minify: true,
            jsx: 'preserve',
            target: 'es2020',
            legalComments: 'none',
          });

          if (result && result.code) {
            fs.writeFileSync(fullPath, result.code, 'utf8');
            const newSize = Buffer.byteLength(result.code, 'utf8');
            const saved = origSize - newSize;
            totalSavedBytes += Math.max(0, saved);
            filesCount++;
          }
        } catch (err) {
          console.warn(`[minify-dist] Failed to minify ${entry.name}:`, err.message);
        }
      } else if (entry.name.endsWith('.json')) {
        try {
          const raw = fs.readFileSync(fullPath, 'utf8');
          const origSize = Buffer.byteLength(raw, 'utf8');
          totalOriginalBytes += origSize;
          const minifiedJson = JSON.stringify(JSON.parse(raw));
          fs.writeFileSync(fullPath, minifiedJson, 'utf8');
          const newSize = Buffer.byteLength(minifiedJson, 'utf8');
          totalSavedBytes += Math.max(0, origSize - newSize);
          filesCount++;
        } catch (err) {
          // ignore
        }
      }
    }
  }

  return { totalSavedBytes, totalOriginalBytes, filesCount };
}

async function run() {
  if (!fs.existsSync(DIST_DIR)) {
    console.warn('[minify-dist] dist directory does not exist.');
    return;
  }

  console.log('[minify-dist] Minifying build artifacts in dist/...');
  const start = Date.now();
  const { totalSavedBytes, totalOriginalBytes, filesCount } = await processDirectory(DIST_DIR);
  const duration = ((Date.now() - start) / 1000).toFixed(2);

  const origKb = (totalOriginalBytes / 1024).toFixed(1);
  const newKb = ((totalOriginalBytes - totalSavedBytes) / 1024).toFixed(1);
  const savedPercent = totalOriginalBytes > 0 ? ((totalSavedBytes / totalOriginalBytes) * 100).toFixed(1) : 0;

  console.log(
    `[minify-dist] ✨ Minified ${filesCount} files in ${duration}s: ${origKb} KB -> ${newKb} KB (-${savedPercent}%)`
  );
}

run().catch(err => {
  console.error('[minify-dist] Error:', err);
  process.exit(1);
});
