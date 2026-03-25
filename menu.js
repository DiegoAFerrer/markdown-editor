const { app, Menu, shell, ipcMain, BrowserWindow, globalShortcut, dialog } = require('electron');
const fs = require('fs');

//registrar atajos globales
app.on('ready', () => {
    globalShortcut.register('CommandOrControl+S', () => {
       saveFile();
    });

    globalShortcut.register('CommandOrControl+O', () => {
        loadFile();
    });
});

function saveFile(){
    console.log('Saving the file');

    const window = BrowserWindow.getFocusedWindow()
    window.webContents.send('editor-event', 'save'); //mismo formato utilizado con las funciones del menu para envíar ordenes.
}

function loadFile(){
    const window = BrowserWindow.getFocusedWindow();
        const options = {
        title: 'Pick a markdown file',
        filters: [
                { name: 'Markdown files', extensions: ['md'] },
                { name: 'Text files', extensions: ['txt'] }
            ]
        };

        dialog.showOpenDialog(window, options).then(result => {
            const filePaths = result.filePaths;
            if (!result.canceled && filePaths && filePaths.length > 0) {
                const content = fs.readFileSync(filePaths[0]).toString();
                window.webContents.send('load', content);

                console.log('Opening File');
            } else{
                console.log('File Canceled');
            };   
        })
}



ipcMain.on('save', (event, arg) => {
    console.log(`Saving content of the file`);
    console.log(arg);
    const window = BrowserWindow.getFocusedWindow();
    const options = {
        title: 'Save markdown file',
        filters: [
            {
                name: 'MyFile',
                extensions: ['md']
            }
        ]
    };

    dialog.showSaveDialog(window, options).then(file => { //método del libro no funcionaba. se implemento .then en su lugar
        if (!file.canceled) {
            console.log(file.filePath.toString());
            
            fs.writeFileSync(file.filePath.toString(), arg);
        } else{
            console.log('File Canceled');
        };
    })
});

//recibir datos de la pagina web
ipcMain.on('editor-reply', (event, arg) => {
    console.log(`Received reply from web page: ${arg}`);
}); 


//definir menu mediante JSON
const template = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Open',
                accelerator: 'CommandOrControl+O',
                click() {
                    loadFile();
                }
            },
            {
                label: 'Save',
                accelerator: 'CommandOrControl+S',
                click(){
                    saveFile();
                }
            }
        ]
    },
    {
        label: 'Format',
        submenu: [
            {
                label: 'Toggle Bold',
                click() {
                    const window = BrowserWindow.getFocusedWindow();
                    window.webContents.send(
                        'editor-event',
                        'toggle-bold'
                    );
                }
            },
            {
                label: 'Toggle Italic',
                click() {
                    const window = BrowserWindow.getFocusedWindow();
                    window.webContents.send(
                        'editor-event',
                        'toggle-italic'
                    );
                }
            },
            {
                label: 'Toggle Strikethrough',
                click() {
                    const window = BrowserWindow.getFocusedWindow();
                    window.webContents.send(
                        'editor-event',
                        'toggle-strikethrough'
                    );
                }
            }
        ]
    },
    {
        role: 'help',
        submenu: 
        [{
            label: 'About Editor Component',
            click() {
                shell.openExternal('https://simplemde.com/');
            }
        }]
    },
];

if (process.platform === 'darwin') {
    template.unshift({
        label: app.getName(),
        submenu: [
            { role: 'about' },
            { type: 'separator' },
            { role: 'quit' }
        ]
    })
}

if (process.env.DEBUG) {
    template.push({
        label: 'Debugging',
        submenu: [
            {
                label: 'Dev Tools',
                role: 'toggleDevTools'
            },

            { type: 'separator' },

            {
                role: 'reload',
                accelerator: 'Alt+R'
            }
        ]
    });
}
const menu = Menu.buildFromTemplate(template);
module.exports = menu;