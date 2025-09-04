const electron = require('electron')
// Module to control application life.
const app = electron.app
const shell = electron.shell
const ipcMain = electron.ipcMain;
const session = electron.session;
const Menu = electron.Menu;
const systemPreferences = electron.systemPreferences;
const webFrameMain = electron.webFrameMain;
const globalShortcut = electron.globalShortcut;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
const path = require("path");
const { isString } = require('util');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow


// 请求单实例锁
if (!app.requestSingleInstanceLock()) {
  console.log("old instance exist, quit");
  app.quit();  // 如果已经有一个实例运行，就退出当前的启动
  return;
}

// 第二实例启动时会触发该事件
app.on('second-instance', (event, commandLine, workingDirectory) => {
  console.log("new instance started");
  // 如果已有实例运行，可以选择杀死它并重新启动

  if (mainWindow) {
    mainWindow.close();  // 关闭之前的窗口
  }

  // 创建新窗口或重新启动应用程序
  createWindow();
});


function setProxy(proxyRules) {
  const mainSession = session.defaultSession
  return mainSession.setProxy({ proxyRules })
}

app.on('ready', createWindow)

function createWindow() {
  // Create the browser window.
  setProxy('http://127.0.0.1:7902');
  mainWindow = new BrowserWindow({
    width: 800, height: 600, show: false, webPreferences: {
      nativeWindowOpen: true,
      nodeIntegration: true,
      allowEval: true,
      webviewTag: true,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      allowRunningInsecureContent: false,
      enableRemoteModule: true,
      preload: path.join(app.getAppPath(), 'bridge.js'),
      plugins: true,
      contextIsolation: true,
      webSecurity: false
    }
  })
  mainWindow.setContentProtection(false);
  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/www/mhgl/fe/start.htm`)

  try {
    ipcMain.handle('nodeReady', function (p) {
      
    });
  } catch (e) {
    console.log(JSON.stringify(e));
  }

  mainWindow.webContents.on('did-finish-load', function (p) {
    mainWindow.show();
  });

  mainWindow.webContents.on('new-window', (event, url, frameName, disposition, options, additionalFeatures) => {
    console.log("new-window");
    console.log("frameName=" + frameName);
    console.log("url=" + url);
    //if (frameName == null || frameName == '_self' || frameName == '') {
    event.preventDefault();
    var t = url.toLowerCase();
    if (t.indexOf("http://") >= 0 || t.indexOf("https://") >= 0) {
      console.log("openExternal");
      shell.openExternal(url);
    } else {
      mainWindow.loadURL(url);
    }
    //}
  })

  function isNumber(val) {
    try {
      if (parseFloat(val).toString() == "NaN") {
        return false;
      } else {
        return true;
      }
    } catch (e) {
      return false;
    }
  }

  function isString(val) {
    return typeof (val) == 'string';
  }

  function isArray(val) {
    return val instanceof Array;
  }

  function stringify(obj, depth) {
    if (depth == null) {
      depth = 1;
    }
    var j = "";

    if (depth < 0) {
      return j;
    }

    if (obj == null) {
      return null;
    } else if (isNumber(obj)) {
      return obj;
    } else if (isString(obj)) {
      return '"' + obj.replace('"', '\\"') + '"';
    } else if (isArray(obj)) {
      j = '[';
      for (var i = 0; i < obj.length; ++i) {
        j += stringify(obj[i], depth - 1);
      }

      j += ']';
    } else {
      for (var k in obj) {
        if (j == "") {
          j += "{";
        } else {
          j += ",";
        }
        j += '"' + k + '":';
        j += stringify(obj[k], depth - 1);
      }

      j += "}";
    }

    return j;
  }


  mainWindow.webContents.session.setCertificateVerifyProc((request, callback) => {
    callback(0)
    // if (request.host === 'your-domain.com') {
    //   callback(0)
    // } else {
    //   callback(-2) // result from Chromium 
    // }
  })



  mainWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
    //console.log("onBeforeRequest(" + details.resourceType + "):" + details.url);
    if (details.resourceType == "subFrame") {
      var t = "";
      if (details.url) {
        t = details.url.toLowerCase();
      }
      
      if ((t.indexOf("http://local.labadida.com") < 0) && (t.indexOf("http://") >= 0 || t.indexOf("https://") >= 0)) {
        callback({ cancel: true });
        console.log("openExternal");
        shell.openExternal(details.url);
        return;
      }
    }

    callback({ cancel: false });
  });

  mainWindow.webContents.on('frame-created', (e, details) => {
    //console.log("*frame-created");
    //console.log("event:" + Object.keys(e));
    //console.log("details:" + Object.keys(details));
    //const frame = webFrameMain.fromId(details.processId, details.routingId)
    //frame.on('dom-ready', () => {})
  })

  mainWindow.webContents.on('will-navigate', (event, url, frameName, disposition, options, additionalFeatures) => {
    
    //if (frameName == null || frameName == '_self' || frameName == '') {
    event.preventDefault();
    var t = url.toLowerCase();
    if ((t.indexOf("http://local.labadida.com") < 0) && (t.indexOf("http://") >= 0 || t.indexOf("https://") >= 0)) {
      shell.openExternal(url);
    } else {
      mainWindow.loadURL(url);
    }
    //}
  })

  mainWindow.webContents.on('did-attach-webview', (e, webContent) => {
    console.log("webview did-attach-webview");
    webContent.on('will-navigate', (e, url) => {
      console.log("webview:" + url);
      e.preventDefault();
      shell.openExternal(url);
    });
  });


  /*
  mainWindow.webContents.on('did-start-navigation', (event, url, frameName, disposition, options, additionalFeatures) => {
    console.log("will-navigate:" + frameName);
    //if (frameName == null || frameName == '_self' || frameName == '') {
    event.preventDefault();
    console.log("loadURL");
    var t = url.toLowerCase();
    if (t.indexOf("http://") >= 0 || t.indexOf("https://") >= 0) {
      shell.openExternal(url);
    } else {
      mainWindow.loadURL(url);
    }
    //}
  })

  app.on('web-contents-created', (e, webContents) => {
    console.log("web-contents-created");
    webContents.on('will-navigate', (event, url) => {
      console.log("web-contents-created will-navigate:" + url);
      event.preventDefault();
      var t = url.toLowerCase();
      if (t.indexOf("http://") >= 0 || t.indexOf("https://") >= 0) {
        shell.openExternal(url);
      } else {
        mainWindow.loadURL(url);
      }
    });
  });
  
  globalShortcut.register('ctrl+x', function () {
    mainWindow.webContents.openDevTools() // 打开F12调试页面
  })

  mainWindow.webContents.send('set-env', { //设置web环境变量
    inElectron: true,
    test: "hello"
  });
  */



  //获取创建好的window对象发送消息
  mainWindow.webContents.on('dom-ready', function () {
    mainWindow.webContents.send('set-env', { //设置web环境变量
      inElectron: true,
      appPath: app.getAppPath()
    })

  });

  /*
  mainWindow.webContents.on('did-frame-navigate', (event, url, httpResponseCode, httpStatusText, isMainFrame, frameProcessId, frameRoutingId) => {
    console.log("did-frame-navigate:" + url);
    //console.log(Object.keys(webFrameMain));
    const frame = webFrameMain.fromId(frameProcessId, frameRoutingId);
    if (frame) {
      console.log("frame:" + Object.keys(frame));
      frame.on('did-attach-webview', (e, webContent) => {
        console.log("webview did-attach-webview");
        webContent.on('will-navigate', (e, url) => {
          console.log("webview:" + url);
          e.preventDefault();
          shell.openExternal(url);
        });
      });


      frame.on('will-navigate', (event, url) => {
        console.log("frame will-navigate:" + url);
        event.preventDefault();
        var t = url.toLowerCase();
        if (t.indexOf("http://") >= 0 || t.indexOf("https://") >= 0) {
          shell.openExternal(url);
        } else {
          mainWindow.loadURL(url);
        }
      });
      //const code ='document.body.innerHTML = document.body.innerHTML.replaceAll("heck", "h*ck")';
      //frame.executeJavaScript(code)
    }
  });
  */

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })


  const { cordova } = require('./extensionInMain.js');
  cordova.mainWindow = mainWindow;
  global.inElectron = true;
  const { inner } = require("./main.js");

  inner.electron = {
    app: app,
    shutdown: function () {
      ipcRenderer.send("shutdown");
    }
  };

}

// Quit when all windows are closed.
app.on('window-all-closed', function () {

  //app.quit();
  app.exit(0);
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  console.log("activate");
  if (mainWindow === null) {
    createWindow()
  }
})

// Windows 版本
if (process.platform === 'win32') {
  process.on('exit', () => {
    require('child_process').exec('taskkill /F /IM AllinEmail.exe')
  })
} else {
  process.on('exit', () => {
    require('child_process').exec('pkill -f "AllinEmail|--no-sandbox"')
  })
}


const requestMediaAccess = async function (mediaType) {

  try {
    // 获取当前媒体设备（在这里指麦克风或摄像头）的访问权限状态
    console.log("requestMediaAccess");
    const privilege = systemPreferences.getMediaAccessStatus(mediaType)
    console.log("privilege=" + privilege);
    if (privilege !== 'granted') {
      // 未授权,则重新唤起系统弹框,等待用户点击授权
      console.log("askForMediaAccess");
      await systemPreferences.askForMediaAccess(mediaType)
      console.log("askForMediaAccess ok");
      // 请求权限后，再次获取媒体访问状态并返回
      return systemPreferences.getMediaAccessStatus(mediaType)
    }
    // 已授权,则直接返回媒体访问状态
    return privilege
  } catch (e) {
    console.error('Failed to request media access:', e)
    return 'unknown'
  }

}

ipcMain.handle('request-media-access', async function (e, mediaType) {
  console.log("mediaType:" + JSON.stringify(mediaType));
  let res = await requestMediaAccess(mediaType);
  return res;
})

app.commandLine.appendSwitch('disable-site-isolation-trials');

ipcMain.on("shutdown", (event, message) => {
  console.log("shutdown");
  app.quit();
});
