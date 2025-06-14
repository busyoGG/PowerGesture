self.bgActions = (function () {
    const actions = {
        "重新打开关闭的标签": async () => {
            console.log("重新打开关闭的标签");
            let sessionInfos = await browser.sessions.getRecentlyClosed({
                maxResults: 1,
            });
            let sessionInfo = sessionInfos[0];
            if (sessionInfo.tab) {
                browser.sessions.restore(sessionInfo.tab.sessionId);
            } else {
                browser.sessions.restore(sessionInfo.window.sessionId);
            }
        },
        "关闭当前标签": () => {
            browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs.length > 0) {
                    // console.log("当前 Tab ID:", tabs[0].id);
                    browser.tabs.remove(tabs[0].id);
                } else {
                    console.log("未找到活动的 Tab");
                }
            });
        },
    }

    // export class DragData {
    //     static actionDone = false;
    //     static actionReject = false;
    // }

    const drags = {
        "打开新标签页(前台)": (data) => {
            // if (!DragData.actionReject) {
            //     DragData.actionDone = true;

            //     browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            //         let currentTab = tabs[0]; // 获取当前激活的标签页
            //         browser.tabs.create({
            //             url: data, // 你要打开的网址
            //             index: currentTab.index + 1 // 在当前标签页的右侧打开
            //         });
            //     });
            // }
            browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                let currentTab = tabs[0]; // 获取当前激活的标签页
                browser.tabs.create({
                    url: data, // 你要打开的网址
                    index: currentTab.index + 1 // 在当前标签页的右侧打开
                });
            });
        },
        "打开新标签页(后台)": (data) => {

            // if (!DragData.actionReject) {
            //     DragData.actionDone = true;

            //     browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            //         let currentTab = tabs[0]; // 获取当前激活的标签页
            //         browser.tabs.create({
            //             url: data, // 你要打开的网址
            //             index: currentTab.index + 1, // 在当前标签页的右侧打开
            //             active: false
            //         });
            //     });
            // }
            browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                let currentTab = tabs[0]; // 获取当前激活的标签页
                browser.tabs.create({
                    url: data, // 你要打开的网址
                    index: currentTab.index + 1, // 在当前标签页的右侧打开
                    active: false
                });
            });
        },
        "搜索": (data) => {
            // if (!DragData.actionReject) {
            //     DragData.actionDone = true;

            //     browser.search.query({ text: data, disposition: "NEW_TAB" });
            // }
            browser.search.query({ text: data, disposition: "NEW_TAB" });
        },
        "下载": (data) => {
            browser.downloads.download({ url: data });
        },
        // "复制图片": (data) => {
        //     // browser.downloads.download({
        //     //     url: data,
        //     //     filename: 'firefox_copy_image.png',   // 自定义文件名
        //     //     conflictAction: 'overwrite',      // 文件名冲突时的处理，默认是 'uniquify'
        //     //     saveAs: false                     // 是否弹出保存对话框，false 就直接保存
        //     // }).then(downloadId => {
        //     //     // console.log('下载已开始，ID:', downloadId);
        //     //     navigator.clipboard.writeText("file://~/Downloads/firefox_copy_image.png")
        //     //         // .then(function () {
        //     //         //     console.log('文本已复制到剪贴板');
        //     //         // })
        //     //         .catch(function (err) {
        //     //             console.error('复制失败:', err);
        //     //         });
        //     // }).catch(err => {
        //     //     console.error('下载失败:', err);
        //     // });
        // }
    }
    return { actions, drags };
})();


console.log("bgActions loaded", self.bgActions);