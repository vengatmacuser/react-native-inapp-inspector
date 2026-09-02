import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

export interface InAppInspectorMetroOptions {
  apkPath?: string;
  endpoint?: string;
}

export interface BuildJob {
  status: 'idle' | 'running' | 'completed' | 'failed';
  scheme: string;
  clean: boolean;
  progress: number;
  currentTask: string;
  logs: string[];
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  apkName: string | null;
  apkSize: number | null;
}

let activeBuildJob: BuildJob = {
  status: 'idle',
  scheme: 'assembleRelease',
  clean: true,
  progress: 0,
  currentTask: '',
  logs: [],
  error: null,
  startedAt: null,
  completedAt: null,
  apkName: null,
  apkSize: null,
};

/**
 * Dynamically discovers all active LAN IPv4 addresses of this machine.
 * Prioritizes Wi-Fi / Ethernet standard local subnets (192.168.x.x, 10.x.x.x, 172.16-31.x.x).
 */
export function getLanIpAddresses(): { primary: string; all: string[] } {
  const interfaces = os.networkInterfaces();
  const validIps: string[] = [];

  for (const name of Object.keys(interfaces)) {
    const netList = interfaces[name];
    if (!netList) continue;
    for (const net of netList) {
      if (
        (net.family === 'IPv4' || (net as any).family === 4) &&
        !net.internal &&
        net.address
      ) {
        validIps.push(net.address);
      }
    }
  }

  const prioritized =
    validIps.find(ip => ip.startsWith('192.168.')) ||
    validIps.find(ip => ip.startsWith('10.')) ||
    validIps.find(ip => /^172\.(1[6-9]|2\d|3[01])\./.test(ip)) ||
    validIps[0] ||
    '127.0.0.1';

  return { primary: prioritized, all: validIps };
}

/**
 * Searches common Android build output directories for any built APK dynamically.
 */
function findDebugApk(customPath?: string): string | null {
  if (customPath && fs.existsSync(customPath)) {
    return customPath;
  }

  const root = process.cwd();
  const searchCandidates = [
    path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'release'),
    path.join(root, 'android', 'app', 'build', 'outputs', 'apk', 'debug'),
    path.join(root, 'example', 'android', 'app', 'build', 'outputs', 'apk', 'release'),
    path.join(root, 'example', 'android', 'app', 'build', 'outputs', 'apk', 'debug'),
    path.join(root, 'app', 'build', 'outputs', 'apk', 'release'),
    path.join(root, 'app', 'build', 'outputs', 'apk', 'debug'),
    path.join(root, 'build', 'outputs', 'apk', 'release'),
    path.join(root, 'build', 'outputs', 'apk', 'debug'),
  ];

  for (const candidate of searchCandidates) {
    if (fs.existsSync(candidate)) {
      const stats = fs.statSync(candidate);
      if (stats.isFile() && candidate.endsWith('.apk')) {
        return candidate;
      }
      if (stats.isDirectory()) {
        try {
          const files = fs.readdirSync(candidate);
          // Find newest APK in folder
          const apkFiles = files
            .filter(f => f.endsWith('.apk'))
            .map(f => ({
              file: path.join(candidate, f),
              mtime: fs.statSync(path.join(candidate, f)).mtimeMs,
            }))
            .sort((a, b) => b.mtime - a.mtime);

          if (apkFiles.length > 0 && apkFiles[0]) {
            return apkFiles[0].file;
          }
        } catch {}
      }
    }
  }

  return null;
}

/**
 * Dynamically discovers the project directory that contains Gradle wrapper (gradlew).
 */
function findGradleDirectory(): { dir: string; cmd: string } {
  const root = process.cwd();
  const isWindows = process.platform === 'win32';
  const gradlewName = isWindows ? 'gradlew.bat' : 'gradlew';

  const candidates = [
    path.join(root, 'android'),
    path.join(root, 'example', 'android'),
    path.join(root, '..', 'android'),
    root,
  ];

  for (const candidate of candidates) {
    const fullGradlew = path.join(candidate, gradlewName);
    if (fs.existsSync(fullGradlew)) {
      return { dir: candidate, cmd: fullGradlew };
    }
  }

  return {
    dir: path.join(root, 'android'),
    cmd: isWindows ? 'gradlew.bat' : './gradlew',
  };
}

let currentGradleProcess: any = null;

/**
 * Spawns Gradle build process with live progress parsing.
 */
function startGradleBuild(scheme = 'assembleRelease', clean = true): BuildJob {
  if (activeBuildJob.status === 'running') {
    return activeBuildJob;
  }

  const isWindows = process.platform === 'win32';
  const { dir: androidDir, cmd: gradlewCmd } = findGradleDirectory();

  // Ensure execution permissions on macOS/Linux
  if (!isWindows && fs.existsSync(gradlewCmd)) {
    try {
      fs.chmodSync(gradlewCmd, '755');
    } catch {}
  }

  const args = clean ? ['clean', scheme, '--console=plain'] : [scheme, '--console=plain'];

  activeBuildJob = {
    status: 'running',
    scheme,
    clean,
    progress: 5,
    currentTask: clean ? 'Cleaning build cache...' : 'Starting build...',
    logs: [
      `🚀 Initializing Gradle build (${scheme})...`,
      `📁 Working Directory: ${androidDir}`,
      clean ? '🧹 Running: gradlew clean ' + scheme : '⚡ Running: gradlew ' + scheme,
    ],
    error: null,
    startedAt: new Date().toISOString(),
    completedAt: null,
    apkName: null,
    apkSize: null,
  };

  try {
    const child = spawn(gradlewCmd, args, {
      cwd: androidDir,
      env: { ...process.env, CI: 'true' },
    });
    currentGradleProcess = child;

    let taskCount = 0;
    const estimatedTotalTasks = clean ? 42 : 32;

    child.stdout.on('data', data => {
      const output = data.toString();
      const lines = output.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          activeBuildJob.logs.push(trimmed);
          if (activeBuildJob.logs.length > 150) {
            activeBuildJob.logs.shift();
          }
        }
        if (trimmed.startsWith('> Task :')) {
          taskCount++;
          const taskName = trimmed.replace('> Task ', '');
          const calculatedProgress = Math.min(
            94,
            Math.round(10 + (taskCount / estimatedTotalTasks) * 80),
          );
          activeBuildJob.progress = calculatedProgress;
          activeBuildJob.currentTask = taskName;
        } else if (trimmed.includes('BUILD SUCCESSFUL')) {
          activeBuildJob.progress = 98;
          activeBuildJob.currentTask = 'Finalizing APK package...';
        }
      }
    });

    child.stderr.on('data', data => {
      const errStr = data.toString();
      const lines = errStr.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          activeBuildJob.logs.push(trimmed);
          if (activeBuildJob.logs.length > 150) {
            activeBuildJob.logs.shift();
          }
        }
      }
      if (errStr.includes('FAILURE') || errStr.includes('error:')) {
        activeBuildJob.error = (activeBuildJob.error || '') + errStr.slice(0, 300);
      }
    });

    child.on('close', code => {
      currentGradleProcess = null;
      activeBuildJob.completedAt = new Date().toISOString();
      if (code === 0) {
        activeBuildJob.status = 'completed';
        activeBuildJob.progress = 100;
        activeBuildJob.currentTask = 'Build finished successfully!';
        activeBuildJob.logs.push('✨ BUILD SUCCESSFUL! APK generated.');
        const apk = findDebugApk();
        if (apk && fs.existsSync(apk)) {
          const stats = fs.statSync(apk);
          activeBuildJob.apkName = path.basename(apk);
          activeBuildJob.apkSize = stats.size;
        }
      } else {
        activeBuildJob.status = 'failed';
        activeBuildJob.currentTask = 'Build failed';
        activeBuildJob.logs.push(`❌ Gradle build failed with exit code ${code}`);
        if (!activeBuildJob.error) {
          activeBuildJob.error = `Gradle exited with code ${code}`;
        }
      }
    });

    child.on('error', err => {
      currentGradleProcess = null;
      activeBuildJob.status = 'failed';
      activeBuildJob.error = err.message;
      activeBuildJob.currentTask = 'Failed to spawn Gradle';
      activeBuildJob.logs.push(`❌ Failed to spawn Gradle: ${err.message}`);
    });
  } catch (err: any) {
    currentGradleProcess = null;
    activeBuildJob.status = 'failed';
    activeBuildJob.error = err?.message || 'Unknown spawn error';
    activeBuildJob.currentTask = 'Error launching build';
    activeBuildJob.logs.push(`❌ Error: ${err?.message || 'Unknown spawn error'}`);
  }

  return activeBuildJob;
}

/**
 * Stops any actively running Gradle build process.
 */
export function stopGradleBuild(): BuildJob {
  if (currentGradleProcess) {
    try {
      if (process.platform === 'win32') {
        const { exec } = require('child_process');
        exec(`taskkill /pid ${currentGradleProcess.pid} /T /F`);
      } else {
        currentGradleProcess.kill('SIGTERM');
        setTimeout(() => {
          try {
            currentGradleProcess?.kill('SIGKILL');
          } catch {}
        }, 1000);
      }
    } catch {}
    currentGradleProcess = null;
  }

  activeBuildJob.status = 'idle';
  activeBuildJob.currentTask = 'Build cancelled';
  activeBuildJob.error = 'Build cancelled by user';
  activeBuildJob.logs.push('🛑 Build cancelled by user.');
  activeBuildJob.completedAt = new Date().toISOString();
  return activeBuildJob;
}

/**
 * Metro Bundler Middleware for react-native-inapp-inspector.
 * Automatically serves debug APK directly from Metro dev server (port 8081)
 * with ZERO extra commands or servers needed.
 * Dynamic IP, port, and APK filename detection included.
 */
export function withInAppInspector(
  metroConfig: any = {},
  options: InAppInspectorMetroOptions = {},
): any {
  const customMiddleware = (req: any, res: any, next: any) => {
    const url = req.url || '';
    const cleanUrl = url.split('?')[0];
    const serverPort = req.socket?.localPort || 8081;
    const { primary: hostIp, all: allIps } = getLanIpAddresses();

    // Build status endpoint
    if (cleanUrl === '/__inapp_inspector/build-status') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      return res.end(JSON.stringify(activeBuildJob));
    }

    // Stop / Cancel Build endpoint
    if (
      cleanUrl === '/__inapp_inspector/stop-build' ||
      cleanUrl === '/__inapp_inspector/cancel-build'
    ) {
      const job = stopGradleBuild();
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      return res.end(JSON.stringify(job));
    }

    // Build trigger endpoint (POST or GET with query params: scheme=assembleRelease&clean=true)
    if (cleanUrl === '/__inapp_inspector/build-apk') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      const queryParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
      const scheme = queryParams.get('scheme') || 'assembleRelease';
      const clean = queryParams.get('clean') !== 'false';

      const job = startGradleBuild(scheme, clean);
      return res.end(JSON.stringify(job));
    }

    // Status / Dynamic telemetry endpoint
    if (
      cleanUrl === '/__inapp_inspector/status' ||
      cleanUrl === '/__inapp_inspector/apk-info'
    ) {
      const apk = findDebugApk(options.apkPath);
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      const apkName = apk ? path.basename(apk) : 'app-debug.apk';
      const dynamicApkUrl = `http://${hostIp}:${serverPort}/${apkName}`;

      if (apk && fs.existsSync(apk)) {
        const stats = fs.statSync(apk);
        return res.end(
          JSON.stringify({
            status: 'ready',
            hasApk: true,
            hostIp,
            allIps,
            port: serverPort,
            apkName,
            apkUrl: dynamicApkUrl,
            apkSize: stats.size,
            apkSizeBytes: stats.size,
            modifiedAt: stats.mtime.toISOString(),
          }),
        );
      } else {
        return res.end(
          JSON.stringify({
            status: 'ready',
            hasApk: false,
            hostIp,
            allIps,
            port: serverPort,
            apkName,
            apkUrl: dynamicApkUrl,
            message:
              'Debug APK not built yet. Run ./gradlew assembleDebug inside android directory.',
          }),
        );
      }
    }

    // Direct APK download endpoint (matches /app-debug.apk, /__inapp_inspector/apk, or any *.apk)
    if (
      cleanUrl === '/app-debug.apk' ||
      cleanUrl === '/__inapp_inspector/apk' ||
      cleanUrl.endsWith('.apk') ||
      (options.endpoint && cleanUrl === options.endpoint)
    ) {
      const apk = findDebugApk(options.apkPath);
      if (apk && fs.existsSync(apk)) {
        const stats = fs.statSync(apk);
        const fileName = path.basename(apk);
        res.writeHead(200, {
          'Content-Type': 'application/vnd.android.package-archive',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': stats.size,
          'Access-Control-Allow-Origin': '*',
        });
        return fs.createReadStream(apk).pipe(res);
      } else {
        res.writeHead(404, {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        });
        return res.end(`
          <!DOCTYPE html>
          <html>
            <head><title>Debug APK Not Found</title></head>
            <body style="font-family: sans-serif; padding: 30px; text-align: center;">
              <h2>Debug APK not built yet</h2>
              <p>Please build the debug APK on your computer:</p>
              <pre style="background: #f4f4f5; padding: 12px; display: inline-block; border-radius: 6px;">cd android && ./gradlew assembleDebug</pre>
              <p>Once built, refresh this page or re-scan the QR code to install!</p>
            </body>
          </html>
        `);
      }
    }

    return next();
  };

  const prevEnhanceMiddleware = metroConfig.server?.enhanceMiddleware;
  metroConfig.server = metroConfig.server || {};
  metroConfig.server.enhanceMiddleware = (middleware: any, server: any) => {
    const enhanced = prevEnhanceMiddleware
      ? prevEnhanceMiddleware(middleware, server)
      : middleware;
    return (req: any, res: any, next: any) => {
      customMiddleware(req, res, () => {
        if (typeof enhanced === 'function') {
          return enhanced(req, res, next);
        }
        return next();
      });
    };
  };

  return metroConfig;
}

/**
 * Starts a standalone zero-config APK & telemetry HTTP server on any port (default: 8083).
 * Perfect when you don't want to edit metro.config.js.
 */
export function startStandaloneServer(port = 8083): any {
  const http = require('http');
  const { primary: hostIp, all: allIps } = getLanIpAddresses();

  const server = http.createServer((req: any, res: any) => {
    const url = req.url || '';
    const cleanUrl = url.split('?')[0];
    // Build status endpoint
    if (cleanUrl === '/__inapp_inspector/build-status') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      return res.end(JSON.stringify(activeBuildJob));
    }

    // Stop / Cancel Build endpoint
    if (
      cleanUrl === '/__inapp_inspector/stop-build' ||
      cleanUrl === '/__inapp_inspector/cancel-build'
    ) {
      const job = stopGradleBuild();
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      return res.end(JSON.stringify(job));
    }

    // Build trigger endpoint (POST or GET with query params: scheme=assembleRelease&clean=true)
    if (cleanUrl === '/__inapp_inspector/build-apk') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      const queryParams = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
      const scheme = queryParams.get('scheme') || 'assembleRelease';
      const clean = queryParams.get('clean') !== 'false';

      const job = startGradleBuild(scheme, clean);
      return res.end(JSON.stringify(job));
    }

    // Status / Health check
    if (
      cleanUrl === '/__inapp_inspector/status' ||
      cleanUrl === '/__inapp_inspector/apk-info' ||
      cleanUrl === '/apk-info'
    ) {
      const apk = findDebugApk();
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      const apkName = apk ? path.basename(apk) : 'app-debug.apk';
      const dynamicApkUrl = `http://${hostIp}:${port}/${apkName}`;

      if (apk && fs.existsSync(apk)) {
        const stats = fs.statSync(apk);
        return res.end(
          JSON.stringify({
            status: 'ready',
            hasApk: true,
            hostIp,
            allIps,
            port,
            apkName,
            apkUrl: dynamicApkUrl,
            apkSize: stats.size,
            apkSizeBytes: stats.size,
            modifiedAt: stats.mtime.toISOString(),
          }),
        );
      } else {
        return res.end(
          JSON.stringify({
            status: 'ready',
            hasApk: false,
            hostIp,
            allIps,
            port,
            apkName,
            apkUrl: dynamicApkUrl,
            message:
              'Debug APK not built yet. Run ./gradlew assembleDebug inside android directory.',
          }),
        );
      }
    }

    // Direct APK download
    if (
      cleanUrl === '/app-debug.apk' ||
      cleanUrl === '/__inapp_inspector/apk' ||
      cleanUrl.endsWith('.apk')
    ) {
      const apk = findDebugApk();
      if (apk && fs.existsSync(apk)) {
        const stats = fs.statSync(apk);
        const fileName = path.basename(apk);
        res.writeHead(200, {
          'Content-Type': 'application/vnd.android.package-archive',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Content-Length': stats.size,
          'Access-Control-Allow-Origin': '*',
        });
        return fs.createReadStream(apk).pipe(res);
      }
    }

    res.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
    return res.end('Not Found');
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`\n📦 [InAppInspector] APK Server listening at http://0.0.0.0:${port}`);
    console.log(`📲 Dynamic LAN IP: http://${hostIp}:${port}/app-debug.apk\n`);
  });

  return server;
}

export default withInAppInspector;
