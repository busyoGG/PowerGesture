export const actions = {
    "重新打开关闭的标签": () => {
        chrome.sessions.restore();
    },
    "关闭当前标签": () => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs.length > 0) {
                // console.log("当前 Tab ID:", tabs[0].id);
                chrome.tabs.remove(tabs[0].id);
            } else {
                console.log("未找到活动的 Tab");
            }
        });
    },
}

export class DragData {
    static actionDone = false;
    static actionReject = false;
}

export const drags = {
    "打开新标签页(前台)": (data) => {
        if (!DragData.actionReject) {
            DragData.actionDone = true;

            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                let currentTab = tabs[0]; // 获取当前激活的标签页
                chrome.tabs.create({
                    url: data, // 你要打开的网址
                    index: currentTab.index + 1 // 在当前标签页的右侧打开
                });
            });
        }
    },
    "打开新标签页(后台)": (data) => {

        if (!DragData.actionReject) {
            DragData.actionDone = true;

            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                let currentTab = tabs[0]; // 获取当前激活的标签页
                chrome.tabs.create({
                    url: data, // 你要打开的网址
                    index: currentTab.index + 1, // 在当前标签页的右侧打开
                    active: false
                });
            });
        }
    },
    "搜索": (data) => {
        if (!DragData.actionReject) {
            DragData.actionDone = true;

            chrome.search.query({ text: data, disposition: "NEW_TAB" });
        }
    },
    "下载": (data) => {
        chrome.downloads.download({ url: data });
    }
}