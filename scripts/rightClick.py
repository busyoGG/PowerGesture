#!/usr/bin/env python3
import asyncio
import websockets
import json
import subprocess
import logging
import requests
import time
import pillow_avif
import io
import base64

# 设置日志配置
logging.basicConfig(
    filename='/home/busyo/Dev/PowerGesture/scripts/app.log',         # 日志文件名
    level=logging.DEBUG,        # 日志级别：DEBUG, INFO, WARNING, ERROR, CRITICAL
    format='%(asctime)s - %(levelname)s - %(message)s',  # 日志格式
)

# 修改后的 fetch_image 函数，处理图像并行化
def fetch_image(image_url, retries=3):
    try:
        for attempt in range(retries):
            try:
                response = requests.get(image_url, timeout=5)  # 缩短超时时间
                response.raise_for_status()
                logging.info("请求图片数据成功")
                break  # 请求成功，跳出循环
            except requests.exceptions.RequestException as e:
                logging.debug(f"请求图片时发生错误: {e}, 尝试第 {attempt + 1} 次重试")
                if attempt == retries - 1:
                    return None
                time.sleep(0.5)  # 缩短重试等待时间
        
        logging.info("保存图片")
        
        if response.status_code == 200:
            with open("/tmp/screenshot.png", "wb") as file:
                file.write(response.content)

        logging.info("复制图片到剪贴板")

        # 直接将完整的图像复制到剪贴板
        subprocess.Popen(["wl-copy", "-t", "text/uri-list"], stdin=subprocess.PIPE).communicate(b"file:///tmp/screenshot.png")
        # with open("/tmp/screenshot.png", "rb") as file:
        #     subprocess.Popen(["wl-copy", "--type", "image/png"], stdin=file)

        # 打开图片文件
        # with open("/tmp/screenshot.png", "rb") as file:
        #     img_data = file.read()

        # image_base64 = base64.b64encode(img_data).decode('utf-8')
        # mime_data = f"image/png;base64,{image_base64}"

        

        # # 使用 BytesIO 创建内存流
        # img_stream = io.BytesIO(img_data)

        # # 调用 subprocess.Popen，传递 stdin=PIPE
        # process = subprocess.Popen(
        #     ["wl-copy", "--type", "image/png"],
        #     stdin=subprocess.PIPE  # 允许我们通过管道传递数据
        # )

        # # 将内存流数据写入到 wl-copy 的 stdin
        # process.stdin.write(img_stream.read())
        # process.stdin.close()  # 关闭 stdin，结束输入

        # # 等待进程完成
        # process.wait()

        # 执行 qdbus 命令
        # subprocess.run([
        #     "copyq", 
        #     "write",  
        #     img_stream,
        #     "image/png"
        # ])

        logging.debug("完整图像已成功复制到剪贴板")
        return 1
    except Exception as e:
        logging.debug(f"处理图片时发生错误: {e}")
        return None


def send_right_click():
    logging.debug("执行鼠标右键点击")
    try:
        # 使用 capture_output 来捕获命令的标准输出和标准错误
        result = subprocess.run(
            ["fish", "-c", "ydotool click 0xC1"],
            check=True,
            capture_output=True,   # 捕获输出
            text=True              # 输出文本格式（而不是字节）
        )
        # 打印命令执行的标准输出
        logging.info(f"ydotool 执行结果: {result.stdout}")
        # 如果有标准错误，可以记录错误信息
        if result.stderr:
            logging.error(f"ydotool 错误信息: {result.stderr}")
    except subprocess.CalledProcessError as e:
        logging.error(f"执行 ydotool 命令时出错: {e}")

async def handle_message(websocket, path):
    """处理 WebSocket 消息"""
    async for message in websocket:
        try:
            message = json.loads(message)
            logging.info(f"接收到消息: {message}")

            if message.get("text") == "right_click":
                send_right_click()
                await websocket.send(json.dumps({"status": "success"}))

            if message.get("img") is not None:
                res = fetch_image(message.get("img"))
                if res is not None:
                    await websocket.send(json.dumps({'status': 'success'}))
                else:
                    await websocket.send(json.dumps({'status': 'error', 'message': 'Failed to fetch image'}))
            
            # 如果没有匹配的操作，返回默认状态
            await websocket.send(json.dumps({"status": "no action"}))
        except json.JSONDecodeError as e:
            logging.error(f"消息解析错误: {e}")
            await websocket.send(json.dumps({'status': 'error', 'message': 'Invalid message format'}))

async def start_server():
    """启动 WebSocket 服务器"""
    server = await websockets.serve(handle_message, "localhost", 8765)
    logging.info("WebSocket 服务器启动，监听端口 8765")
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(start_server())