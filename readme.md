# Zendesk chatbot来支持通话机器人

## 第一步 初始化机器人

https://support.zendesk.com/hc/en-us/articles/4500748175258-Installing-the-Web-Widget-for-messaging

## 第二步 如何让zendesk chatbot自动回应客户

[教程似乎要看这个](https://developer.zendesk.com/documentation/conversations/getting-started/api-quickstart/)

按照这个操作， 可以成功

## 第三步 在nodejs集成dify api来完成知识库接入


## 启动和接入

NGROK_AUTHTOKEN=2vAJRkkq8w1ZZI5QzLN2M2Qp8FC_4fZ1KuqwmHmbqHxhWi46B node index.js

App listening on port 8000


## 调试通了， 但是有个问题。 zendesk call message会retry

## 整体设置步骤参考 

# Sunshine Conversations API Examples

## Get started

For a detailed guide, see the [Sunshine Conversations API Quickstart](https://developer.zendesk.com/documentation/conversations/getting-started/api-quickstart/):

### Node.js

1. Clone the repository
2. Go to the _nodejs_ subdirectory
3. Install dependencies (`npm install`)
4. Use [ngrok](https://ngrok.com/) to create a secure tunnel to port 8000 (`ngrok http 8000` after ngrok is installed on your PC)
5. Create a webhook and API key in Admin Center and point it at the full url for the `/messages` endpoint (e.g. `https://MY-NGROK-DOMAIN.ngrok.io/messages`)
6. Update `index.js` to set proper values for `ZENDESK_SUBDOMAIN`, `KEY_ID` and `KEY_SECRET`
7. Run the server (`node index`)
8. Send messages to your Web Widget and watch the auto-replies roll in
