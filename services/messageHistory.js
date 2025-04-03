"use strict";

class MessageHistory {
  constructor(options = {}) {
    this.history = new Map();
    this.maxAge = options.maxAge || 5 * 60 * 1000; // 默认5分钟后清理
    this.cleanupInterval = options.cleanupInterval || 60 * 1000; // 默认每1分钟清理一次
    this.startCleanupTimer();
  }

  // 添加消息到历史记录
  addMessage(messageId) {
    this.history.set(messageId, {
      timestamp: Date.now(),
      status: 'processing'
    });
  }

  // 更新消息状态
  updateStatus(messageId, status) {
    const message = this.history.get(messageId);
    if (message) {
      message.status = status;
    }
  }

  // 检查消息是否已存在且正在处理或已处理
  isMessageProcessed(messageId) {
    return this.history.has(messageId);
  }

  // 清理过期的消息记录
  cleanup() {
    const now = Date.now();
    for (const [messageId, data] of this.history.entries()) {
      if (now - data.timestamp > this.maxAge) {
        this.history.delete(messageId);
      }
    }
  }

  // 启动定时清理
  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);

    // 确保进程退出时清理定时器
    process.on('exit', () => {
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
      }
    });
  }

  // 停止定时清理
  stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

module.exports = MessageHistory;
