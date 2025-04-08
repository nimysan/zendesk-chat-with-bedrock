"use strict";

const { workflowCall, agentStreamCall } = require('./DifyClient');
const BedrockClient = require('./BedrockClient');

class AIChatbot {
  constructor(config = {}) {
    this.config = {
      ...config
    };
    this.bedrockClient = new BedrockClient();
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
      switch (mode) {
        case 'workflow':
          return await workflowCall(userInput, options.difyApiKey);
        case 'agent':
          return await agentStreamCall(
            userInput,
            options.difyApiKey,
            options.onProgress
          );
        case 'bedrock':
          return await this.bedrockClient.processInputWithStream(userInput, {
            agentId: process.env.BEDROCK_AGENT_ID,
            agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID,
            sessionId: options.sessionId,
            onProgress: options.onProgress
          });
        default:
          throw new Error(`不支持的模式: ${mode}`);
      }
    } catch (error) {
      console.error('AI处理错误:', error);
      throw error;
    }
  }
}

module.exports = AIChatbot;
