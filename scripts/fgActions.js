var actions = {
    "滚动到顶部": () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    },
    "滚动到底部": () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    },
    "滚动到左侧": () => {
        window.scrollBy({ left: -window.innerWidth, behavior: "smooth" });
    },
    "滚动到右侧": () => {
        window.scrollBy({ left: window.innerWidth, behavior: "smooth" });
    },
    "刷新页面": () => {
        window.location.reload();
    }
}

var drags = {
    "复制": (text) => {
        navigator.clipboard.writeText(text)
            // .then(function () {
            //     console.log('文本已复制到剪贴板');
            // })
            .catch(function (err) {
                console.error('复制失败:', err);
            });
    },
    "复制图片": (img) => {
        chrome.runtime.sendMessage({ img: img });
    }
}

function init() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message?.command) {
            actions[message.command]();
        }

        if (message?.drag) {
            drags[message.drag](message.data);
        }
    });
}

init();