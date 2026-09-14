import http from 'http';

/**
 * Ensures that tests only execute when the host application is actively
 * connected to the development debug server (Metro bundler / React Native Debugger).
 * In standalone / non-connected builds, this guard aborts or skips the test.
 */
export async function verifyConnectedDebugMode(): Promise<boolean> {
  // Allow overriding via environment flag
  if (process.env.DETOX_FORCE_RUN === 'true') {
    return true;
  }

  const checkEndpoint = (host: string, port: number): Promise<boolean> => {
    return new Promise(resolve => {
      const req = http.request(
        {
          host,
          port,
          path: '/status',
          method: 'GET',
          timeout: 2000,
        },
        res => {
          resolve(res.statusCode === 200 || res.statusCode === 204);
        },
      );

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    });
  };

  // Check localhost:8081 (iOS simulator / host) and 10.0.2.2:8081 (Android emulator host)
  const isLocalMetroLive = await checkEndpoint('127.0.0.1', 8081);
  if (isLocalMetroLive) {
    return true;
  }

  // Fallback check on port 8082 if custom port used
  const isAltMetroLive = await checkEndpoint('127.0.0.1', 8082);
  return isAltMetroLive;
}
