"use strict";

const fetch = require('node-fetch');

require('dotenv').config();

// Dify API配置
const DIFY_CONFIG = {
  baseUrl: process.env.DIFY_API_BASE_URL,
  endpoints: {
    workflowMessages: '/workflows/run',
    agentMessages: '/chat-messages'
  }
};

class DifyClient {
  constructor(config = DIFY_CONFIG) {
    this.config = config;
    this.workflowEndpoint = `${config.baseUrl}${config.endpoints.workflowMessages}`;
    this.agentEndpoint = `${config.baseUrl}${config.endpoints.agentMessages}`;
  }

  /**
   * 使用工作流模式调用Dify API
   * @param {string} userMessage - 用户消息
   * @param {string} apiKey - API密钥
   * @returns {Promise<string>} - 返回完整的响应内容
   */
  async workflowCall(userMessage, apiKey) {
    // console.log('准备发送工作流请求到 Dify API...');

    try {
      const response = await fetch(this.workflowEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: {
            user_query: userMessage
          },
          response_mode: "blocking",
          user: process.env.DIFY_USER_ID
        })
      });
      // console.log(response)
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('收到工作流响应:', data);

      return {
        workflow_run_id: data.workflow_run_id,
        task_id: data.task_id,
        data: {
          id: data.data.id,
          workflow_id: data.data.workflow_id,
          status: data.data.status,
          outputs: data.data.outputs,
          error: data.data.error,
          elapsed_time: data.data.elapsed_time,
          total_tokens: data.data.total_tokens,
          total_steps: data.data.total_steps || 0,
          created_at: data.data.created_at,
          finished_at: data.data.finished_at
        }
      };
    } catch (error) {
      console.error('Dify工作流调用错误:', error);
      throw error;
    }
  }

  /**
   * 使用流式方式调用Dify Agent API
   * @param {string} userMessage - 用户消息
   * @param {string} apiKey - API密钥
   * @param {function} onProgress - 处理流式响应的回调函数
   * @returns {Promise<string>} - 返回完整的响应内容
   */
  /**
   * 使用流式方式调用Dify Agent API
   * @param {string} userMessage - 用户消息
   * @param {string} apiKey - API密钥
   * @param {function} onProgress - 处理流式响应的回调函数
   * @param {object} options - 可选参数
   * @param {string} options.conversationId - 会话ID
   * @param {array} options.files - 文件数组，每个文件对象包含type、transfer_method和url
   * @returns {Promise<string>} - 返回完整的响应内容
   */
  async agentStreamCall(userMessage, apiKey, onProgress, options = {}) {
    // console.log('准备发送流式请求到 Dify 聊天API...');
    let fullResponse = '';
    let lastThought = '';  // 用于存储最后一个agent_thought的内容

    try {
      const requestBody = {
        inputs: {},
        query: userMessage,
        response_mode: "streaming",
        conversation_id: '',
        user: process.env.DIFY_USER_ID
      };

      if (options.files && Array.isArray(options.files)) {
        requestBody.files = options.files;
      }

      const response = await fetch(this.agentEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      let buffer = '';

      await new Promise((resolve, reject) => {
        response.body.on('data', async chunk => {
          buffer += chunk.toString();
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                // console.log("--- event --- " + data.event);
                if (data.event === 'agent_thought') {
                  const content = data.thought || data.answer || '';
                  if (content) {
                    lastThought = content;  // 保存最后一个agent_thought的内容
                  }
                } else if (data.event === 'message_end') {
                  fullResponse = lastThought;  // 使用最后一个agent_thought作为最终响应
                  if (onProgress) {
                    onProgress({
                      type: 'stream',
                      event: 'message_end',
                      content: fullResponse,
                      raw: data
                    });
                  }
                  resolve(fullResponse);
                  return;
                }
              } catch (e) {
                console.error('解析SSE数据失败:', e, '\n原始数据:', line);
                reject(e);
                return;
              }
            }
          }
        });

        response.body.on('end', () => {
          // 如果没有收到message_end事件，使用最后一个agent_thought作为响应
          if (lastThought) {
            fullResponse = lastThought;
          }
          // console.log("type of " + resolve)
          resolve(fullResponse);
        });

        response.body.on('error', reject);
      });

      console.log('聊天流式回答完成:', fullResponse);
      return fullResponse;
    } catch (error) {
      console.error('Dify Agent API调用错误:', error);
      throw error;
    }
  }
}

// 创建单例实例
const difyClient = new DifyClient();

// 导出实例方法
module.exports = {
  workflowCall: (userMessage, apiKey) => difyClient.workflowCall(userMessage, apiKey),
  agentStreamCall: (userMessage, apiKey, onProgress) => difyClient.agentStreamCall(userMessage, apiKey, onProgress),
  DifyClient // 导出类以便需要时可以创建新实例
};
