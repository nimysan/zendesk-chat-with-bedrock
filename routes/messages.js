"use strict";

const SunshineConversationsApi = require("sunshine-conversations-client");
const AIChatbot = require("../ai_chatbot");
const MessageHistory = require("../services/messageHistory");
const { json } = require("body-parser");

const chatbot = new AIChatbot();
const messageHistory = new MessageHistory();

async function sendMessage(apiInstance, appId, conversationId, text) {
  const messagePost = new SunshineConversationsApi.MessagePost();
  messagePost.setAuthor({ type: "business" });
  //增加Reply按钮 -  https://developer.zendesk.com/documentation/conversations/messaging-platform/programmable-conversations/structured-messages/#reply-buttons
  messagePost.setContent({
    type: "text", text, "actions": [
      {
        type: "reply",
        text: "转人工",
        iconUrl: "https://example.org/taco.png",
        payload: "转人工"
      }
    ]
  });
  const response = await apiInstance.postMessage(
    appId,
    conversationId,
    messagePost
  );
  // console.log("API RESPONSE:\n", JSON.stringify(response, null, 4));
}

async function passControl(apiSwitchBoardInstance, appId, conversationId) {
  var passControlBody = new SunshineConversationsApi.PassControlBody();
  passControlBody.switchboardIntegration = "zd-agentWorkspace";
  console.log("--- pass control --- " + JSON.stringify(passControlBody)); // PassControlBody | 
  await apiSwitchBoardInstance.passControl(appId, conversationId, passControlBody).then(function (data) {
    console.log('API called successfully. Returned data: ' + data);
  }, function (error) {
    console.error(error);
  });
}

async function sendTypingActivity(apiActivityInstance, appId, conversationId) {
  // about how to sending typing activity https://developer.zendesk.com/documentation/conversations/messaging-platform/programmable-conversations/sending-messages/
  const data = new SunshineConversationsApi.ActivityPost();
  data.author = {
    type: "business"
  };
  data.type = "typing:start";
  await apiActivityInstance.postActivity(appId, conversationId, data);
}

async function handleMessages(req, res) {
  const appId = req.body.app.id;
  const [event] = req.body.events;

  if (event.type === "conversation:message") {
    const { conversation, message } = event.payload;

    // 检查消息是否已经处理过
    // 过滤条件检查
    if (message.author.type === "user" && !messageHistory.isMessageProcessed(message.id)) {
      // 检查消息内容是否为空
      if (!message.content.text || message.content.text.trim() === '') {
        console.log(`消息 ${message.id} 被过滤：内容为空`);
        return res.end();
      }

      // 检查消息长度是否超过限制（例如1000字符）
      if (message.content.text.length > 1000) {
        console.log(`消息 ${message.id} 被过滤：内容超过1000字符`);
        await sendMessage(
          req.apiInstance,
          appId,
          conversation.id,
          "抱歉，您的消息太长了，请缩短后重试。"
        );
        return res.end();
      }

      // 检查消息是否包含敏感词（示例）
      const sensitiveWords = ['spam', 'test', '测试'];
      if (sensitiveWords.some(word => message.content.text.toLowerCase().includes(word))) {
        console.log(`消息 ${message.id} 被过滤：包含敏感词`);
        return res.end();
      }

      // 标记消息为正在处理
      messageHistory.addMessage(message.id);
      console.log("app id " + appId + " conversion id " + JSON.stringify(conversation));
      console.log("--->message id " + message.id + "---- message content " + message.content.text);

      try {
        const startTime = Date.now();
        await sendTypingActivity(req.apiActivityInstance, appId, conversation.id);

        if("转人工"===message.content.text){
          await passControl(req.apiSwithBoardInstance, appId, conversation.id);
          return;
        }
        
        // 使用AIChatbot处理用户输入
        const mode = process.env.AI_MODE || 'agent'; // 可选值：'agent'(dify), 'bedrock'
        const response = await chatbot.processInput(message.content.text, {
          mode: mode,
          difyApiKey: process.env.DIFY_AGENT_API_KEY,
          sessionId: conversation.id, // 使用会话ID作为bedrock的sessionId
          onProgress: async (chunk) => {
            let responseText = chunk.content;
            console.log("----responseText ---  " + responseText)
            // // 如果是bedrock模式且有引用，添加引用信息
            // if (mode === 'bedrock' && chunk.citations && chunk.citations.length > 0) {
            //   responseText += '\n\n参考资料：\n';
            //   chunk.citations.forEach((citation, index) => {
            //     if (citation.snippetText) {
            //       responseText += `${index + 1}. ${citation.snippetText}\n`;
            //     }
            //   });
            // }
            
            await sendMessage(
              req.apiInstance,
              appId,
              conversation.id,
              responseText
            );
          }
        });

        const endTime = Date.now();
        const processingTime = endTime - startTime;
        console.log(`-------AI处理完成，耗时: ${processingTime}ms`);
        // 更新消息状态为已完成
        messageHistory.updateStatus(message.id, 'completed');
      } catch (error) {
        console.error("Error sending message:", error);
        // 发送错误消息给用户
        await sendMessage(
          req.apiInstance,
          appId,
          conversation.id,
          "抱歉，处理您的消息时出现了错误。"
        );
        // 更新消息状态为错误
        messageHistory.updateStatus(message.id, 'error');
      }
    }
  }

  res.end();
}

module.exports = {
  handleMessages
};
