import { actions, drags } from "./scripts/bgActions.js";

let lastTabId = null;
let lastActivatedTime = 0;
const DOUBLE_CLICK_DELAY = 300; // 双击的最大时间间隔（毫秒）

function init() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message?.action === "simulateRightClick") {
            sendNativeMessage({ text: "right_click" }, () => {
                sendResponse(true);
            });
        }

        if (message?.img) {
            sendNativeMessage({ img: message.img });
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
            } else {
                // console.log("未知的拖动事件:", message.drag);
                chrome.tabs.sendMessage(sender.tab.id, message);
            }
        }

        return true;
    });

    // chrome.tabs.onActivated.addListener((activeInfo) => {
    //     const currentTime = Date.now();
    //     const currentTabId = activeInfo.tabId;

    //     // 判断是否是同一个 Tab，如果是，且点击的时间间隔小于 DOUBLE_CLICK_DELAY，则认为是双击
    //     if (lastTabId === currentTabId && currentTime - lastActivatedTime <= DOUBLE_CLICK_DELAY) {
    //         // 触发双击事件
    //         console.log('Tab double-clicked!');
    //         chrome.tabs.sendMessage(currentTabId, { action: 'double_click' });
    //     }

    //     console.log("激活标签", activeInfo);

    //     // 更新最后一次激活的 Tab 和时间
    //     lastTabId = currentTabId;
    //     lastActivatedTime = currentTime;
    // });
}

function sendNativeMessage(data, callback) {
    chrome.runtime.sendNativeMessage("simulation.right.click",
        data,
        (response) => {
            if (chrome.runtime.lastError) {
                console.error("发送失败:", chrome.runtime.lastError);
            } else {
                console.log("Native 响应:", response);
            }
            callback && callback();
        }
    );
}

init();