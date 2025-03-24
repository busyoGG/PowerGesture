#!/usr/bin/env python3
import sys
import json
import subprocess
import logging
import requests
import base64
import pillow_avif

from io import BytesIO
from PIL import Image

# import subprocess
# import time
from concurrent.futures import ThreadPoolExecutor

# 设置日志配置
logging.basicConfig(
    filename='app.log',         # 日志文件名
    level=logging.ERROR,        # 日志级别：DEBUG, INFO, WARNING, ERROR, CRITICAL
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
        
        with open("/tmp/screenshot.png", "rb") as file:
            subprocess.Popen(["wl-copy", "--type", "image/png"], stdin=file)
        
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

def read_message():
    """读取 Chrome 发送的消息"""
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length:
        return None
    message_length = int.from_bytes(raw_length, byteorder="little")
    message = sys.stdin.buffer.read(message_length).decode("utf-8")
    return json.loads(message)

def send_response(response):
    """返回响应给 Chrome 插件"""
    response_json = json.dumps(response)
    response_length = len(response_json).to_bytes(4, byteorder="little")
    sys.stdout.buffer.write(response_length)
    sys.stdout.buffer.write(response_json.encode("utf-8"))
    sys.stdout.buffer.flush()

if __name__ == "__main__":
    while True:
        message = read_message()
        logging.info(f"传入信息: {message}")
        # send_response({"message": message})
        if message is None:
            # send_response({"status": "None"})
            break
        if message.get("text") == "right_click":
            send_right_click()
            send_response({"status": "success"})

        if message.get("img") is not None:
            res = fetch_image(message.get("img"))
            if res is not None:
                send_response({'status': 'success'})
                
        send_response({"status": "no action"})
