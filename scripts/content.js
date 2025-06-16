// import { actions } from "./actions.js";

console.log("Run PowerGesture")

var _mousePos;
var _isMouseUp = false;
var _isMouseDown = false;

var Overlay;
var _canvas;
var _ctx;
var _hint;

var _trails = [];
var _isDrawing = false;

var _originPoints = [];
var _detectedPoints = "";

var _actSettings = {
    "上": [
        "滚动到顶部"
    ],
    "下": [
        "滚动到底部"
    ],
    "左": [
        "滚动到左侧"
    ],
    "右": [
        "滚动到右侧"
    ],
    "左上": [],
    "左下": [],
    "右上": [],
    "右下": [],
    "上左": [],
    "上右": [],
    "下左": [],
    "下右": [],
    "左右": [
        "刷新页面"
    ],
    "右左": [
        "重新打开关闭的标签"
    ],
    "上下": [],
    "下上": [
        "关闭当前标签"
    ]
}

var _dragStartPoint;
var _dragEndPoint;
var _dragData;

var _dragSettings = {
    "上": {
        "文本": "复制",
        "链接": "复制",
        "图片": "复制图片",
    },
    "下": {
        "链接": "下载",
        "图片": "下载"
    },
    "左": {
        "文本": "搜索",
        "图片": "打开新标签页(前台)",
        "链接": "打开新标签页(前台)"
    },
    "右": {
        "文本": "搜索",
        "图片": "打开新标签页(后台)",
        "链接": "打开新标签页(后台)"
    },
}

var _action;

function init() {
    // removeListener();
    initCanvas();
    initListener(Overlay);
    // let iframes = document.querySelectorAll("iframe");
    // console.log("iframes:", iframes);
    // if (iframes.length > 0) {
    //     for (let i = 0; i < iframes.length; i++) {
    //         // initListener(iframes[i]);
    //         console.log("iframe", iframes[i].window)
    //     }
    // }
}

function initCanvas() {

    Overlay = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    // Overlay.popover = "manual";
    Overlay.style.cssText = `
        all: initial !important;
        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483647 !important;
        pointer-events: none !important;
    `;

    Overlay.id = "overlay"

    // Overlay.classList.add("no-events")

    if (!document.body || document.documentElement.namespaceURI !== "http://www.w3.org/1999/xhtml") {
        return;
    }
    if (document.body.tagName.toUpperCase() === "FRAMESET") {
        document.documentElement.appendChild(Overlay);
    }
    else {
        document.body.appendChild(Overlay);
    }

    // Overlay.showPopover();

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css"
    link.href = browser.runtime.getURL("css/styles.css");; // 替换成你的 CSS 文件路径
    document.head.appendChild(link);

    _canvas = document.createElement("canvas");
    _canvas.id = "power_gesture";
    _canvas.width = window.innerWidth;
    _canvas.height = window.innerHeight;
    // document.body.append(_canvas);
    // document.body.insertBefore(_canvas, document.body.firstChild);
    Overlay.appendChild(_canvas);

    _hint = document.createElement("div");
    _hint.id = "power_gesture_hint";
    _hint.classList.add("power-gesture-hint");

    document.body.appendChild(_hint);
    _hint.style.display = "none";

    _canvas.classList.add("power-gesture")
    // _canvas.classList.add("hide")

    _ctx = _canvas.getContext("2d");

    // _canvas.requestFullscreen();
}

function initListener(targetElement) {
    // targetElement.addEventListener("contextmenu", (e) => {
    //     if (!_isMouseUp) {
    //         e.preventDefault()
    //         e.stopPropagation();
    //     }
    // }, true);

    document.addEventListener("mousedown", (e) => {
        if (e.button === 2) {
            _isMouseDown = true;
            _mousePos = { x: e.clientX, y: e.clientY };
            targetElement.style.pointerEvents = "auto";
        }

        window.TARGET = e.composedPath()[0];
        // targetElement.classList.remove("no-events");
    }, true);

    document.addEventListener("mouseup", (e) => {
        // targetElement.classList.add("no-events");
        targetElement.style.pointerEvents = "none";
    }, true);

    targetElement.addEventListener("mouseup", (e) => {
        if (e.button === 2 && Math.abs(e.clientX - _mousePos.x) < 2 && Math.abs(e.clientY - _mousePos.y) < 2) {
            if (!_isMouseUp) {
                _isMouseUp = true;
                callRIghtClick();
            }
        } else {
            doAction();
        }

        // targetElement.classList.add("no-events");
        targetElement.style.pointerEvents = "none";
        console.log("鼠标抬起", targetElement.classList);

        clearProps();
    }, true);

    // let count = 5;
    targetElement.addEventListener("mousemove", (e) => {
        if (_isMouseDown) {
            collectTrail({ x: e.clientX, y: e.clientY });
            animate();
            detectPathShape();
            checkAction();
            console.log("鼠标移动")
        }
    }, true);

    let dragData;

    //拖拽开始
    document.addEventListener('dragstart', async function (event) {
        // _dragData = event.dataTransfer.getData("Files") || event.dataTransfer.getData("text/plain") || event.dataTransfer.getData("text/uri-list");
        // console.log('拖拽开始:', event.dataTransfer.getData("text/uri-list"), event.dataTransfer.getData("text/plain"), event.dataTransfer.getData("Files"));
        _dragStartPoint = { x: event.clientX, y: event.clientY };
        updateStatus("dragStart");

        dragData = await getDragData(event)
    }, true);

    //拖拽结束
    document.addEventListener('dragend', function (event) {
        _dragEndPoint = { x: event.clientX, y: event.clientY };
        // console.log('拖拽结束:', _dragEndPoint);
        const outOfBounds = _dragEndPoint.x < 0 || _dragEndPoint.y < 0 || _dragEndPoint.x > window.innerWidth || _dragEndPoint.y > window.innerHeight;

        if (!outOfBounds) {
            doDrag(dragData);
        }
        // const rect = getDragTarget().getBoundingClientRect();
    }, true);
}

function clearProps() {
    _isDrawing = false;
    _isMouseDown = false;
    _trails = [];
    _ctx.clearRect(0, 0, _canvas.width, _canvas.height);
    _originPoints = [];
    _action = null;
    _hint.style.display = "none";
}

function collectTrail(pos) {
    _trails.push(pos);
    _originPoints.push(pos);
}

function drawTrail() {
    if (_canvas === null || _ctx === null)
        return;

    let pos = _trails.shift();
    if (!pos) return; // 防止 undefined 访问 pos.x 报错

    _ctx.strokeStyle = "rgb(150, 193, 235)";

    // 设置线条宽度为 5 像素
    _ctx.lineWidth = 4;

    if (!_isDrawing) {
        _isDrawing = true;
        _ctx.beginPath(); // 仅在开始绘制时调用
        _ctx.moveTo(pos.x, pos.y);
    } else {
        _ctx.lineTo(pos.x, pos.y);
        _ctx.stroke(); // 只在追加路径时调用
    }
}

// 动画循环
function animate() {
    if (_canvas === null) return;
    if (!_isDrawing) {
        _canvas.width = window.innerWidth;
        _canvas.height = window.innerHeight;
    }
    drawTrail(); // 绘制拖尾
    // (_isDrawing) && requestAnimationFrame(animate); // 继续动画
}

function callRIghtClick() {
    browser.runtime.sendMessage({ action: "simulateRightClick" }, function (response) {
        // console.log("收到响应:", response);

        const mouseUpEvent = new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            view: window
        });

        // 触发事件（模拟鼠标抬起）
        document.dispatchEvent(mouseUpEvent);

        _isMouseUp = false;
    });
}

//检测手势
function detectPathShape(sampleInterval = 5) {
    if (_originPoints.length < 2) return "路径太短";

    let prevDirection = null;
    _detectedPoints = "";

    for (let i = sampleInterval; i < _originPoints.length; i += sampleInterval) {
        let dx = _originPoints[i].x - _originPoints[i - sampleInterval].x;
        let dy = _originPoints[i].y - _originPoints[i - sampleInterval].y;

        let dir = getDirection(dx, dy);

        // 只记录明显的方向变化
        if (dir && dir !== prevDirection) {
            _detectedPoints += dir;
            prevDirection = dir;
        }
    }

    // return directions.join(" → ");
    return _detectedPoints;
}

// 获取四方向
function getDirection(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? "右" : "左";
    } else if (Math.abs(dy) > Math.abs(dx)) {
        return dy > 0 ? "下" : "上";
    }
    return null;
}

function checkAction() {
    if (_detectedPoints.length > 2) {
        _hint.style.display = "none";
        _action = null;
        return;
    }
    for (let key in _actSettings) {
        if (key === _detectedPoints) {
            _hint.style.display = "block";
            _hint.textContent = key + ": " + _actSettings[key];
            _hint.style.left = window.innerWidth * 0.5 + "px";
            _hint.style.top = window.innerHeight * 0.5 + "px";
            // console.log("触发动作:", key);

            _action = _actSettings[key];
        }
    }
}

function doAction() {
    browser.runtime.sendMessage({ command: _action });
}

function updateStatus(status) {
    browser.runtime.sendMessage({ status: status });
}

function doDrag(data) {
    let dragData = data.data;
    let dir = getDragDir(data.drag);
    console.log("拖拽数据:", dragData, "方向:", dir);
    browser.runtime.sendMessage({ drag: dir, data: dragData });
}

// function detectDrag() {

// }

function getDragDir(drag) {
    //检测拖拽方向
    let dx = _dragEndPoint.x - _dragStartPoint.x;
    let dy = _dragEndPoint.y - _dragStartPoint.y;
    let dir = getDirection(dx, dy);
    console.log("拖拽方向:", dir, drag)

    return _dragSettings[dir][drag];
}

async function getDragData(input) {

    // let target = input.target;
    let res = "";

    const items = input.dataTransfer?.items;
    if (!items) {
        // console.log('无拖拽items');
        return null;
    }

    const stringPromises = [];

    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // 优先检查 file 类型（图片文件）
        if (item.kind === 'file') {
            const file = item.getAsFile();
            if (file && file.type.startsWith('image/')) {
                // return;
                res = file;
                break;
            }
        } else if (item.kind === 'string') {
            // 处理 string 类型异步内容
            stringPromises.push(new Promise(resolve => {
                let temp = item;
                item.getAsString(str => {
                    resolve([temp.type, str]);
                });
            }));
        }
    }

    let datas = await Promise.all(stringPromises);
    // console.log(datas);

    let drag;
    if (datas && datas.length > 0) {
        for (const [type, str] of datas) {
            // console.log('拖拽类型：', type, '内容：', str);
            let match = str.match(/https?:\/\/.+\.(png|jpe?g|gif|webp|bmp|svg|avif)/i)
            if (!type.includes("html") && match) {
                // console.log('拖拽类型：图片链接，地址:', match[0]);
                // copyImageFromUrl(str);
                drag = "图片";
                res = match[0];
                break;
            } else if (!type.includes("html") && /^https?:\/\//i.test(str)) {
                // console.log('检测到链接:', type, str);
                drag = "链接";
                res = str;
            } else if ((!res || res == "") && type === "text/plain") {
                // console.log('检测到文本:', str);
                // if()
                if (isURL(str)) {
                    drag = "链接";
                } else {
                    drag = "文本";
                }
                res = str;
            }
        }
    }

    // console.log('拖拽数据:', res, drag);

    // return { drag: _dragSettings[dir][drag], data: res };
    return { drag: drag, data: res };
}

function isURL(text) {
    const urlRegex = /^(https?:\/\/)?([\w\-]+\.)+[a-z]{2,6}(\/[\w\-._~:/?#[\]@!$&'()*+,;=]*)?$/i;
    return urlRegex.test(text.trim());
}

init();