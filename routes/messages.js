"use strict";

const SunshineConversationsApi = require("sunshine-conversations-client");
const AIChatbot = require("../ai_chatbot");
const MessageHistory = require("../services/messageHistory");

const chatbot = new AIChatbot();
const messageHistory = new MessageHistory();

async function sendMessage(apiInstance, appId, conversationId, text) {
  const messagePost = new SunshineConversationsApi.MessagePost();
  messagePost.setAuthor({ type: "business" });
  messagePost.setContent({ type: "text", text });
  const response = await apiInstance.postMessage(
    appId,
    conversationId,
    messagePost
  );
  // console.log("API RESPONSE:\n", JSON.stringify(response, null, 4));
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
    if (message.author.type === "user" && !messageHistory.isMessageProcessed(message.id)) {
      // 标记消息为正在处理
      messageHistory.addMessage(message.id);
      console.log("app id " + appId + " conversion id " + JSON.stringify(conversation));
      console.log("--->message id " + message.id + "---- message content " + message.content.text);

      try {
        const startTime = Date.now();
        await sendTypingActivity(req.apiActivityInstance, appId, conversation.id);

        // 使用AIChatbot处理用户输入
        const response = await chatbot.processInput(message.content.text, {
          mode: 'agent',
          difyApiKey: process.env.DIFY_AGENT_API_KEY,
          onProgress: async (chunk) => {
            await sendMessage(
              req.apiInstance,
              appId,
              conversation.id,
              chunk.content
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
