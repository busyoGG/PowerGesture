
var actions = {
    "滚动到顶部": (target) => {
        scrollToTop(window.TARGET);
        // browser.runtime.sendMessage({ cmd: ["102"] })
    },
    "滚动到底部": (target) => {
        scrollToBottom(window.TARGET);
        // browser.runtime.sendMessage({ cmd: ["107"] })
    },
    // "滚动到左侧": () => {
    //     scrollToLeft();
    // },
    // "滚动到右侧": () => {
    //     scrollToRight();
    // },
    "刷新页面": () => {
        window.location.reload();
    }
}

var drags = {
    "复制": (text) => {
        // console.log("复制", text)
        navigator.clipboard.writeText(text)
            // .then(function () {
            //     console.log('文本已复制到剪贴板');
            // })
            .catch(function (err) {
                console.error('复制失败:', err);
            });
    },
    "复制图片": (img) => {
        browser.runtime.sendMessage({ img: img });
        // copyImageAsPng(img);
    }
}



function init() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message?.command) {
            actions[message.command](message.attr);
        }

        if (message?.drag) {
            drags[message.drag](message.data);
        }
    });
}

function findScrollableElementDeep(target) {
    // console.log("滚动目标", target)
    return getClosestElement(target, isScrollableY)
}

function scrollToTop(target) {
    const ele = findScrollableElementDeep(target);
    if (ele) {
        ele.scrollTo({ top: 0, behavior: "smooth" });
    }
}

function scrollToBottom(target) {
    const ele = findScrollableElementDeep(target);

    if (ele) {
        ele.scrollTo({ top: ele.scrollHeight, behavior: "smooth" });
    }
}

function scrollToLeft() {
    const eles = findScrollableElementDeep();

    for (let el of eles) {
        el.scrollTo && el.scrollTo({ left: 0, behavior: 'smooth' });
    }
}

function scrollToRight() {
    const eles = findScrollableElementDeep();

    for (let el of eles) {
        el.scrollTo && el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    }
}

// function getScrollTarget() {
//     return specialEle[window.location.href]?.call() || window;
// }

function getClosestElement(startNode, testFunction) {
    console.log("滚动测试")
    let node = startNode;
    // weak comparison to check for null OR undefined
    while (node != null && !testFunction(node)) {
        // second condition allows traversing up shadow DOMs
        node = node.parentElement ?? node.parentNode?.host;
    }
    return node;
}

function isScrollableY(element) {
    if (!(element instanceof Element)) {
        return false;
    }
    const style = window.getComputedStyle(element);

    if (element.scrollHeight > element.clientHeight &&
        style["overflow-y"] !== "hidden" &&
        style["overflow-y"] !== "clip"
    ) {
        if (element === document.scrollingElement) {
            return true;
        }
        // exception for textarea elements
        else if (element.tagName.toLowerCase() === "textarea") {
            return true;
        }
        // normal elements with display inline can never be scrolled
        else if (style["overflow-y"] !== "visible" && style["display"] !== "inline") {
            // special check for body element (https://drafts.csswg.org/cssom-view/#potentially-scrollable)
            if (element === document.body) {
                const parentStyle = window.getComputedStyle(element.parentElement);
                if (parentStyle["overflow-y"] !== "visible" && parentStyle["overflow-y"] !== "clip") {
                    return true;
                }
            }
            else {
                return true;
            }
        }
    }

    return false;
}


init();