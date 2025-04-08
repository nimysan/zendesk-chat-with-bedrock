const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require("@aws-sdk/client-bedrock-agent-runtime");

class BedrockClient {

  constructor() {
    const config = {
      accessKeyId: process.env.AWS_BEDROCK_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_BEDROCK_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-west-2',
    };
    this.client = new BedrockAgentRuntimeClient(config);
  }

  // 解析位置信息的辅助方法
  parseLocation(location) {
    if (!location) return null;

    switch (location.type) {
      case 'S3':
        return { type: 'S3', uri: location.s3Location?.uri };
      case 'WEB':
        return { type: 'WEB', url: location.webLocation?.url };
      case 'KENDRA':
        return { type: 'KENDRA', uri: location.kendraDocumentLocation?.uri };
      case 'SHAREPOINT':
        return { type: 'SHAREPOINT', url: location.sharePointLocation?.url };
      case 'SALESFORCE':
        return { type: 'SALESFORCE', url: location.salesforceLocation?.url };
      case 'CONFLUENCE':
        return { type: 'CONFLUENCE', url: location.confluenceLocation?.url };
      case 'CUSTOM':
        return { type: 'CUSTOM', id: location.customDocumentLocation?.id };
      case 'SQL':
        return { type: 'SQL', query: location.sqlLocation?.query };
      default:
        return null;
    }
  }

  async processInput(input, options = {}) {
    const { agentId, agentAliasId, sessionId, onProgress } = options;

    if (!agentId || !agentAliasId) {
      throw new Error('Agent ID and Agent Alias ID are required');
    }

    try {
      const command = new InvokeAgentCommand({
        agentId: agentId,
        agentAliasId: agentAliasId,
        sessionId: sessionId || Date.now().toString(),
        inputText: input,
        enableTrace: true,
        inferenceConfiguration: {
          temperature: 0.7,
          topP: 1,
          maximumLength: 2048,
          stopSequences: [],
          streaming: true
        },
        streamingConfigurations: {
          streamFinalResponse: false,
          applyGuardrailInterval: 1000
        }
      });

      try {
        const response = await this.client.send(command);
        let finalResponse = "";
        // Handle the streaming response
        for await (const chunk of response.completion) {
          if (chunk.chunk?.bytes) {
            // Convert the bytes to text
            const textDecoder = new TextDecoder();
            const text = textDecoder.decode(chunk.chunk.bytes);
            finalResponse = finalResponse + text;
            console.log("Received chunk:", text);

          }
        }
        console.log("jello ---- " + finalResponse)
        if (onProgress) {
          console.log(finalResponse)
          await onProgress({
            type: 'stream',
            event: 'message_end',
            content: finalResponse
          });
        }
      } catch (error) {
        console.error("Error in streaming:", error);
        throw error;
      }

    } catch (error) {
      console.error('Error calling Bedrock Agent:', error);
      throw error;
    }
  }

  // 处理流式响应的方法
  async processInputWithStream(input, options = {}) {
    const { agentId, agentAliasId, sessionId, onProgress } = options;

    if (!agentId || !agentAliasId) {
      throw new Error('Agent ID and Agent Alias ID are required');
    }

    try {
      const command = new InvokeAgentCommand({
        agentId: agentId,
        agentAliasId: agentAliasId,
        sessionId: sessionId || Date.now().toString(),
        inputText: input,
        enableTrace: true,
        inferenceConfiguration: {
          temperature: 0.7,
          topP: 1,
          maximumLength: 2048,
          stopSequences: [],
          streaming: true
        },
        streamingConfigurations: {
          streamFinalResponse: true, //关键参数差异
          applyGuardrailInterval: 1000
        }
      });

      try {
        const response = await this.client.send(command);
        let finalResponse = "";
        // Handle the streaming response
        for await (const chunk of response.completion) {
          if (chunk.chunk?.bytes) {
            // Convert the bytes to text
            const textDecoder = new TextDecoder();
            const text = textDecoder.decode(chunk.chunk.bytes);
            finalResponse = finalResponse + text;
            console.log("Received chunk:", text);

          }
        }
        console.log("jello ---- " + finalResponse)
        if (onProgress) {
          console.log(finalResponse)
          await onProgress({
            type: 'stream',
            event: 'message_end',
            content: finalResponse
          });
        }
      } catch (error) {
        console.error("Error in streaming:", error);
        throw error;
      }
    } catch (error) {
      console.error('Error calling Bedrock Agent:', error);
      throw error;
    }
  }
}

module.exports = BedrockClient;
