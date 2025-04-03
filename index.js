"use strict";

// Set environment variables
process.env.NGROK_DOMAIN = process.env.NGROK_DOMAIN || 'working-buzzard-plainly.ngrok-free.app';

const express = require("express");
const bodyParser = require("body-parser");
const SunshineConversationsApi = require("sunshine-conversations-client");
const { handleMessages } = require("./routes/messages");

require('dotenv').config();

const ZENDESK_SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN;
const KEY_ID = process.env.KEY_ID;
const KEY_SECRET = process.env.KEY_SECRET;
const PORT = 8000;

// Config Sunshine Conversations API
let defaultClient = SunshineConversationsApi.ApiClient.instance;
defaultClient.basePath = `https://${ZENDESK_SUBDOMAIN}/sc`;

let basicAuth = defaultClient.authentications["basicAuth"];
basicAuth.username = KEY_ID;
basicAuth.password = KEY_SECRET;

const apiInstance = new SunshineConversationsApi.MessagesApi();
const apiActivityInstance = new SunshineConversationsApi.ActivitiesApi()

// Initialize Express server
const app = express();
app.use(bodyParser.json());

// Add apiInstance to request object for use in route handlers
app.use((req, res, next) => {
  req.apiInstance = apiInstance;
  req.apiActivityInstance = apiActivityInstance
  next();
});

// Routes
app.post("/messages", handleMessages);

// Start server with ngrok
async function startServer() {
  try {
    app.listen(PORT, () => {
      console.log(`App listening on port ${PORT}`);
    });

    const ngrok = require('@ngrok/ngrok');
    const listener = await ngrok.connect({
      addr: PORT,
      authtoken: process.env.NGROK_AUTHTOKEN,
      domain: process.env.NGROK_DOMAIN
    });
    console.log(`Ingress established at: ${listener.url()}`);
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
}

startServer().catch(error => {
  console.error('未捕获的错误:', error);
  process.exit(1);
});
