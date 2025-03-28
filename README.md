# 自用 Linux KDE Wayland 下 Chrome 鼠标手势解决方案

## 简介

该方案为 Chrome 扩展插件，辅以外部鼠标控制（Chrome 不支持手动触发 contextmenu，需要外部调用鼠标右键来触发）和 Python 服务器（负责拖拽图片复制相关功能，避免 CROS 问题）。

通过 canvas 绘制鼠标轨迹，根据鼠标手势执行对应功能（暂无自定义）。

右键手势支持四方向：上、下、左、右 以及 两两组合（如：左上）。

左键可超级拖拽，支持四方向：上、下、左、右。

具体对应功能请查看源码。

> Python 服务器需要手动启动

## 依赖

* [用户态ydotool](https://github.com/ReimuNotMoe/ydotool/issues/241#issuecomment-2464715161)
* python(具体 Python 库见 rightClick.py 引用)
* wl-clipboard

## 项目结构

```
PowerGesture
 ├─css
 │  └─styles.css    #样式文件
 ├─scripts
 │  ├─content.js    #网页主脚本
 │  ├─fgContent.js  #网页功能响应脚本
 │  └─bgContent.js  #插件功能响应脚本
 ├─background.js    #插件后台
 └─manifest.json    #插件声明文件
```