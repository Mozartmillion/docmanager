const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
    // 通用数据操作
    loadData: (type) => ipcRenderer.invoke('load-data', type),
    saveData: (type, data) => ipcRenderer.invoke('save-data', type, data),
    
    // 文件对话框 - 打开文件
    openFiles: (filters) => ipcRenderer.invoke('open-files', filters),
    
    // 文件对话框 - 保存文件
    saveFile: (content, defaultName, filters) => ipcRenderer.invoke('save-file', content, defaultName, filters),
    
    // 打开外部文件
    openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
    
    // 在文件管理器中显示
    showInFolder: (filePath) => ipcRenderer.invoke('show-in-folder', filePath),
    
    // 获取数据存储路径
    getDataPath: () => ipcRenderer.invoke('get-data-path'),
    
    // 检测是否在 Electron 环境
    isElectron: true
});
