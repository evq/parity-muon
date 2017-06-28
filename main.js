const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const app = electron.app;

const path = require('path');
const rq = require('request-promise');

var mainWindow = null;

const mainAddr = 'http://localhost:8180';

const template = [
  {
    label: 'File',
    submenu: [
      {role: 'quit'}
    ]
  },
  {
    label: 'Edit',
    submenu: [
      {role: 'undo'},
      {role: 'redo'},
      {type: 'separator'},
      {role: 'cut'},
      {role: 'copy'},
      {role: 'paste'},
      {role: 'pasteandmatchstyle'},
      {role: 'delete'},
      {role: 'selectall'}
    ]
  },
  {
    label: 'View',
    submenu: [
  //    {role: 'reload'},
  //    {role: 'forcereload'},
      {type: 'separator'},
      {role: 'resetzoom'},
      {role: 'zoomin'},
      {role: 'zoomout'},
      {type: 'separator'},
      {label: 'Toggle Developer Tools',
       accelerator: ( function() {
        if (process.platform == 'darwin') {
           return 'Alt+Command+I';
        } else {
             return 'Ctrl+Shift+I';
        }
       })(),
       click: function(item, focusedWindow) {
         if (focusedWindow) {
           focusedWindow.webContents.send('openDevTools');
         }
       }
      },
      {label: 'Toggle Parity Logs',
       accelerator: ( function() {
         return 'Shift+F8';
       })(),
       click: function(item, focusedWindow) {
         if (focusedWindow) {
           focusedWindow.openDevTools();
         }
       }
      },
      {role: 'togglefullscreen'}
    ]
  }
];

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

app.on('window-all-closed', function() {
  app.quit();
});

app.on('ready', function() {
  var bin = require('child_process').execFile(path.join(__dirname, 'parity/target/release/parity'));

  var openWindow = function(){
    mainWindow = new BrowserWindow({width: 800, height: 600});
    mainWindow.loadURL('file://' + __dirname + '/index.html');
    mainWindow.on('closed', function() {
      mainWindow = null;
      bin.kill('SIGINT');
    });

    renderer_log = function(message) {
      if (mainWindow) {
        mainWindow.webContents.send('consoleLog', message)
      }
    }

    bin.stdout.on('data', (data) => {
      renderer_log(`${data}`);
      console.log(`${data}`);
    });

    bin.stderr.on('data', (data) => {
      renderer_log(`${data}`);
      console.log(`${data}`);
    });

    bin.on('close', (code) => {
      renderer_log(`parity process exited with code ${code}`);
      console.log(`parity process exited with code ${code}`);
    });
  };

   var startUp = function(){
    rq(mainAddr)
      .then(function(htmlString){
        console.log('started parity');
        openWindow();
      })
      .catch(function(err){
        startUp();
      });
  };

  startUp();
});
