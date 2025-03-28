import { actions, drags, DragData } from "./scripts/bgActions.js";

let socket = new WebSocket('ws://localhost:8765');
let retryInterval = 5000; // 每5秒重试一次连接

function init() {
    connectToServer();

    chrome.tabs.onCreated.addListener(() => {
        if (!DragData.actionDone) {
            DragData.actionReject = true;
        }

        DragData.actionDone = false;
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message?.action === "simulateRightClick") {
            // 发送右键点击消息
            sendWebSocketMessage({ text: "right_click" }, sendResponse);
        }

        if (message?.img) {
            // 发送图片消息
            sendWebSocketMessage({ img: message.img }, sendResponse);
        }

        if (message?.command) {
            if (actions[message.command]) {
                actions[message.command]();
            } else {
                chrome.tabs.sendMessage(sender.tab.id, message);
            }
        }

        if (message?.drag) {
            if (drags[message.drag]) {
                drags[message.drag](message.data);
                DragData.actionReject = false;
            } else {
                chrome.tabs.sendMessage(sender.tab.id, message);
            }
        }

        return true; // 保持异步响应
    });
}

function connectToServer() {
    // 连接 WebSocket 服务器
    socket = new WebSocket('ws://localhost:8765');

    // 打开 WebSocket 连接时，发送一些初始化操作
    socket.onopen = () => {
        console.log('WebSocket 连接已建立');
    };

    // 错误处理
    socket.onerror = (error) => {
        console.error('WebSocket 错误:', error);
    };

    // 监听 WebSocket 消息
    socket.onmessage = (event) => {
        const response = JSON.parse(event.data);
        console.log('收到响应:', response);
    };

    // WebSocket 连接关闭时的处理
    socket.onclose = () => {
        console.log('WebSocket 连接已关闭');
        setTimeout(connectToServer, retryInterval);
    };
}

// 通过 WebSocket 发送消息的封装函数
function sendWebSocketMessage(message, callback) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
        console.log('发送消息:', message);
        // 等待响应
        socket.onmessage = (event) => {
            const response = JSON.parse(event.data);
            console.log('收到响应:', response);
            if (response.status === 'success') {
                callback && callback(true);
            } else {
                callback && callback(false);
            }
        };
    } else {
        console.error('WebSocket 连接未打开');
        callback && callback(false);
    }
}

init();