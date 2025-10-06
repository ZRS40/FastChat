const { app, BrowserWindow } = require('electron')
const path = require('path')

async function waitFor(url, timeoutMs = 15000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return true
    } catch {}
    await new Promise(r => setTimeout(r, 500))
  }
  return false
}

function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  win.webContents.on('did-fail-load', (_e, code, desc) => {
    console.error('Failed to load:', code, desc)
  })
  win.webContents.on('crashed', () => console.error('Renderer crashed'))

  if (process.env.FASTCHAT_PROD === '1' || process.env.NODE_ENV === 'production') {
    // Load built static files
    const distIndex = path.join(__dirname, '..', 'web', 'dist', 'index.html')
    win.loadFile(distIndex)
  } else {
    const url = 'http://localhost:3000'
    waitFor(url, 20000).then((ok) => {
      win.loadURL(ok ? url : 'data:text/html,<h1>Frontend not reachable on :3000</h1><p>Start Vite dev server.</p>')
    })
  }
}

app.whenReady().then(createWindow)


