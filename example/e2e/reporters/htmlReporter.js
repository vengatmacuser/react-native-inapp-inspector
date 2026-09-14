const fs = require('fs');
const path = require('path');

class HtmlReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  onRunComplete(contexts, results) {
    const reportDir = path.resolve(__dirname, '../artifacts');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, {recursive: true});
    }

    const screenshotsDir = path.join(reportDir, 'screenshots');
    let screenshotFiles = [];
    if (fs.existsSync(screenshotsDir)) {
      const getFiles = dir => {
        const subdirs = fs.readdirSync(dir);
        subdirs.forEach(file => {
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            getFiles(fullPath);
          } else if (file.endsWith('.png')) {
            const relPath = path.relative(reportDir, fullPath);
            screenshotFiles.push({
              fileName: file,
              relPath,
              name: file.replace('.png', '').replace(/_/g, ' '),
            });
          }
        });
      };
      getFiles(screenshotsDir);
    }

    const totalTests = results.numTotalTests;
    const passedTests = results.numPassedTests;
    const failedTests = results.numFailedTests;
    const duration = ((Date.now() - results.startTime) / 1000).toFixed(1);
    const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 100;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Detox E2E Visual Test Report • react-native-inapp-inspector</title>
  <style>
    :root {
      --bg: #0B0F17;
      --card: #151C28;
      --card-border: #232E42;
      --primary: #6366F1;
      --success: #10B981;
      --danger: #EF4444;
      --text: #F8FAFC;
      --text-muted: #94A3B8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 32px 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--card-border);
    }
    .header h1 { font-size: 24px; font-weight: 800; }
    .header p { color: var(--text-muted); font-size: 13px; margin-top: 4px; }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .metric-card {
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px;
    }
    .metric-title { font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }
    .metric-val { font-size: 28px; font-weight: 800; margin-top: 6px; }
    .metric-val.green { color: var(--success); }
    .metric-val.red { color: var(--danger); }
    .metric-val.indigo { color: var(--primary); }
    .section-title { font-size: 18px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }
    .screenshot-card {
      background: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      overflow: hidden;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .screenshot-card:hover {
      transform: translateY(-4px);
      border-color: var(--primary);
    }
    .img-wrapper {
      background: #000;
      height: 380px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .img-wrapper img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .card-footer {
      padding: 12px 16px;
      border-top: 1px solid var(--card-border);
    }
    .card-title {
      font-size: 13px;
      font-weight: 600;
      text-transform: capitalize;
      color: var(--text);
    }
    .links-row {
      margin-top: 32px;
      display: flex;
      gap: 12px;
    }
    .btn {
      display: inline-block;
      background: var(--primary);
      color: #fff;
      padding: 10px 18px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>🧪 Detox Simulation Test Report</h1>
        <p>react-native-inapp-inspector • Automated E2E Gray-Box Test Matrix</p>
      </div>
      <div>
        <span style="font-size: 12px; color: var(--text-muted);">Duration: <b>${duration}s</b></span>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-title">Pass Rate</div>
        <div class="metric-val ${passRate === 100 ? 'green' : 'red'}">${passRate}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Total Tests</div>
        <div class="metric-val indigo">${totalTests}</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Passed</div>
        <div class="metric-val green">${passedTests}</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Failed</div>
        <div class="metric-val ${failedTests > 0 ? 'red' : 'green'}">${failedTests}</div>
      </div>
    </div>

    <h2 class="section-title">📸 Milestone Screenshots (${screenshotFiles.length})</h2>
    <div class="gallery-grid">
      ${
        screenshotFiles.length > 0
          ? screenshotFiles
              .map(
                s => `
        <div class="screenshot-card">
          <div class="img-wrapper">
            <img src="${s.relPath}" alt="${s.name}" loading="lazy" />
          </div>
          <div class="card-footer">
            <div class="card-title">${s.name}</div>
          </div>
        </div>`,
              )
              .join('')
          : '<p style="color: var(--text-muted)">No screenshots captured in this run.</p>'
      }
    </div>

    <div class="links-row">
      <a href="../../coverage/lcov-report/index.html" class="btn" target="_blank">📊 View Istanbul Code Coverage Report</a>
    </div>
  </div>
</body>
</html>`;

    fs.writeFileSync(path.join(reportDir, 'report.html'), html);
  }
}

module.exports = HtmlReporter;
