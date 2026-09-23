import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  // APIs you want to expose to React will go here
});

console.log('Preload loaded');