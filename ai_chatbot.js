"use strict";

const { workflowCall, agentStreamCall } = require('./DifyClient');

class AIChatbot {
  constructor(config = {}) {
    this.config = {
      ...config
    };
  }

  /**
   * 处理用户输入并返回AI响应
   * @param {string} userInput - 用户输入的消息
   * @param {object} options - 可选参数
   * @param {string} options.mode - 调用模式：'workflow' 或 'agent'
   * @param {function} options.onProgress - 流式响应的进度回调
   * @returns {Promise<string|object>} - 返回AI响应
   */
  async processInput(userInput, options = {}) {
    const mode = options.mode || 'workflow';
    // console.log(`使用${mode}模式处理用户输入:`, userInput);

    try {
      if (mode === 'workflow') {
        return await workflowCall(userInput, options.difyApiKey);
      } else {
        return await agentStreamCall(
          userInput,
          options.difyApiKey,
          options.onProgress
        );
      }
    } catch (error) {
      console.error('AI处理错误:', error);
      throw error;
    }
  }
}

module.exports = AIChatbot;
