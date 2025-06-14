// import { actions, drags, DragData } from "./scripts/bgActions.js";

let socket = new WebSocket('ws://127.0.0.1:8765');
let retryInterval = 5000;
const { actions, drags } = self.bgActions;

// let status = "";

function init() {
    connectToServer();

    // browser.tabs.onCreated.addListener(() => {
    //     if (status === "dragStart") {
    //         if (!DragData.actionDone) {
    //             DragData.actionReject = true;
    //         }
    //         DragData.actionDone = false;
    //     }
    //     status = "";
    // });

    browser.runtime.onMessage.addListener((message, sender) => {
        // if (message?.status) {
        //     status = message.status;
        // }

        // if (message?.action === "simulateRightClick") {
        //     return sendWebSocketMessage({ text: "right_click" });
        // }

        if (message?.img) {
            return sendWebSocketMessage({ img: message.img });
        }

        if (message?.command) {
            if (actions[message.command]) {
                actions[message.command]();
            } else if (sender.tab?.id) {
                browser.tabs.sendMessage(sender.tab.id, message);
            }
        }

        // if (message?.cmd) {
        //     return sendWebSocketMessage({ command: message.cmd });
        // }

        if (message?.drag) {
            if (drags[message.drag]) {
                drags[message.drag](message.data);
                // DragData.actionReject = false;
            } else if (sender.tab?.id) {
                browser.tabs.sendMessage(sender.tab.id, message);
            }
        }

        return Promise.resolve(true); // 保持异步响应
    });
}

function connectToServer() {
    socket = new WebSocket('ws://localhost:8765');

    socket.onopen = () => {
        console.log('WebSocket connected');
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    socket.onmessage = (event) => {
        const response = JSON.parse(event.data);
        console.log('Received:', response);
    };

    socket.onclose = () => {
        console.log('WebSocket closed, retrying...');
        setTimeout(connectToServer, retryInterval);
    };
}

function sendWebSocketMessage(message) {
    return new Promise((resolve) => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
            console.log('Sent:', message);

            socket.onmessage = (event) => {
                const response = JSON.parse(event.data);
                console.log('Response:', response);
                resolve(response.status === 'success');
            };
        } else {
            console.error('WebSocket not open');
            resolve(false);
        }
    });
}

init();
