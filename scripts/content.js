// import { actions } from "./actions.js";

console.log("Run PowerGesture")

var _mousePos;
var _isMouseUp = false;
var _isMouseDown = false;

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
    "下上": []
}

var _dragStartPoint;
var _dragEndPoint;
var _dragData;

var _dragSettings = {
    "上": {
        "文本": "复制",
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
    initListener();
}

function initCanvas() {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css"
    link.href = chrome.runtime.getURL("css/styles.css");; // 替换成你的 CSS 文件路径
    document.head.appendChild(link);

    _canvas = document.createElement("canvas");
    _canvas.id = "power_gesture";
    _canvas.width = window.innerWidth;
    _canvas.height = window.innerHeight;
    // document.body.append(_canvas);
    document.body.insertBefore(_canvas, document.body.firstChild);

    _hint = document.createElement("div");
    _hint.id = "power_gesture_hint";
    _hint.classList.add("power-gesture-hint");

    document.body.appendChild(_hint);
    _hint.style.display = "none";

    _canvas.classList.add("power-gesture")

    _ctx = _canvas.getContext("2d");

    // _canvas.requestFullscreen();
}

function initListener() {
    document.addEventListener("contextmenu", (e) => {
        if (!_isMouseUp) {
            e.preventDefault()
            e.stopPropagation();
        }
    }, true);

    document.addEventListener("mousedown", (e) => {
        if (e.button === 2) {
            _isMouseDown = true;
            _mousePos = { x: e.clientX, y: e.clientY };
        }

        // console.log("鼠标按下");
    }, true);

    document.addEventListener("mouseup", (e) => {
        if (e.button === 2 && Math.abs(e.clientX - _mousePos.x) < 2 && Math.abs(e.clientY - _mousePos.y) < 2) {
            if (!_isMouseUp) {
                _isMouseUp = true;
                callRIghtClick();
            }
        } else {
            doAction();
        }

        // console.log("鼠标抬起");

        clearProps();
    }, true);

    // let count = 5;
    document.addEventListener("mousemove", (e) => {
        if (_isMouseDown) {
            collectTrail({ x: e.clientX, y: e.clientY });
            animate();
            detectPathShape();
            checkAction();
        }
    }, true);

    //拖拽开始
    document.addEventListener('dragstart', function (event) {
        _dragData = event.dataTransfer.getData("Files") || event.dataTransfer.getData("text/plain") || event.dataTransfer.getData("text/uri-list");
        // console.log('拖拽开始:', event.dataTransfer.getData("text/uri-list"), event.dataTransfer.getData("text/plain"), event.dataTransfer.getData("Files"));
        _dragStartPoint = { x: event.clientX, y: event.clientY };
    }, true);

    //拖拽结束
    document.addEventListener('dragend', function (event) {
        // console.log('拖拽结束:', event.target);
        _dragEndPoint = { x: event.clientX, y: event.clientY };
        // const rect = getDragTarget().getBoundingClientRect();
        doDrag(event);
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
    chrome.runtime.sendMessage({ action: "simulateRightClick" }, function (response) {
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
    chrome.runtime.sendMessage({ command: _action });
}

function doDrag(data) {
    let drag = getDragData(data);
    console.log("拖拽数据:", drag, _dragData);
    chrome.runtime.sendMessage({ drag: drag.drag, data: drag.data });
}

function detectDrag() {

}

function getDragData(input) {

    let target = input.target;
    let res = "";
    //检测拖拽方向
    let dx = _dragEndPoint.x - _dragStartPoint.x;
    let dy = _dragEndPoint.y - _dragStartPoint.y;
    let dir = getDirection(dx, dy);

    let drag = null;
    if ((target instanceof Text || target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        res = window.getSelection().toString();
        if (!res) {
            res = _dragData;
        }
        if (res.startsWith("http")) {
            drag = "链接";
        } else {
            drag = "文本";
        }
    } else if (target.tagName === "IMG") {
        drag = "图片";
        res = target.src;

    } else if (target.tagName === "A") {
        drag = "链接";
        res = target.href;
    } else {
        if (_dragData.indexOf("http") !== -1) {
            drag = "链接"
        } else {
            drag = "文本"
        }
        res = _dragData;
    }

    return { drag: _dragSettings[dir][drag], data: res };
}

init();