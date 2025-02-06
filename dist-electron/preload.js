"use strict";const{contextBridge:n,ipcRenderer:s}=require("electron");n.exposeInMainWorld("electronAPI",{sendMessage:e=>s.send("message",e),onMessage:e=>s.on("message",e)});
