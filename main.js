const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// 数据存储路径
const userDataPath = app.getPath('userData');
const dataDir = path.join(userDataPath, 'RefManager');
const attachmentsDir = path.join(dataDir, 'attachments');

// 确保数据目录存在
function ensureDataDir() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(attachmentsDir)) {
        fs.mkdirSync(attachmentsDir, { recursive: true });
    }
}

// 获取数据文件路径
function getDataFile(type) {
    return path.join(dataDir, `${type}.json`);
}

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        title: 'RefManager 文献管理助手',
        show: false
    });

    mainWindow.loadFile('index.html');

    // 窗口准备好后显示
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // 外部链接用默认浏览器打开
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
}

app.whenReady().then(() => {
    ensureDataDir();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// ============================================
// IPC 通信处理
// ============================================

// 加载数据（通用）
ipcMain.handle('load-data', async (event, type) => {
    try {
        const filePath = getDataFile(type);
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error(`加载 ${type} 数据失败:`, error);
        return null;
    }
});

// 保存数据（通用）
ipcMain.handle('save-data', async (event, type, data) => {
    try {
        const filePath = getDataFile(type);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return { success: true };
    } catch (error) {
        console.error(`保存 ${type} 数据失败:`, error);
        return { success: false, error: error.message };
    }
});

// 打开文件选择对话框
ipcMain.handle('open-files', async (event, filters) => {
    try {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile', 'multiSelections'],
            filters: filters || [
                { name: '所有支持的格式', extensions: ['bib', 'ris', 'xml', 'json', 'pdf', 'doc', 'docx'] }
            ]
        });

        if (result.canceled) {
            return { success: false, canceled: true };
        }

        // 读取文件内容
        const files = await Promise.all(result.filePaths.map(async (filePath) => {
            const ext = path.extname(filePath).toLowerCase();
            const fileName = path.basename(filePath);
            const stats = fs.statSync(filePath);
            
            // 二进制文件只返回路径信息
            if (['.pdf', '.doc', '.docx'].includes(ext)) {
                return {
                    name: fileName,
                    path: filePath,
                    size: stats.size,
                    content: null
                };
            }
            
            // 文本文件读取内容
            const content = fs.readFileSync(filePath, 'utf8');
            return {
                name: fileName,
                path: filePath,
                size: stats.size,
                content: content
            };
        }));

        return { success: true, files };
    } catch (error) {
        console.error('打开文件失败:', error);
        return { success: false, error: error.message };
    }
});

// 保存导出文件
ipcMain.handle('save-file', async (event, content, defaultName, filters) => {
    try {
        const result = await dialog.showSaveDialog(mainWindow, {
            defaultPath: defaultName,
            filters: filters || [
                { name: 'JSON', extensions: ['json'] }
            ]
        });

        if (result.canceled) {
            return { success: false, canceled: true };
        }

        fs.writeFileSync(result.filePath, content, 'utf8');
        return { success: true, filePath: result.filePath };
    } catch (error) {
        console.error('保存文件失败:', error);
        return { success: false, error: error.message };
    }
});

// 打开文件（用系统默认程序）
ipcMain.handle('open-file', async (event, filePath) => {
    try {
        await shell.openPath(filePath);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// 在文件管理器中显示文件
ipcMain.handle('show-in-folder', async (event, filePath) => {
    shell.showItemInFolder(filePath);
    return { success: true };
});

// 获取数据存储路径
ipcMain.handle('get-data-path', async () => {
    return dataDir;
});
