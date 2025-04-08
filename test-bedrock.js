require('dotenv').config();
const BedrockClient = require('./BedrockClient');

async function testBedrockClient() {
  const client = new BedrockClient();

  // 测试参数验证
  console.log('\n1. 测试参数验证');
  try {
    await client.processInput('测试消息', {});
    console.log('❌ 测试失败：应该抛出缺少参数错误');
  } catch (error) {
    console.log('✅ 测试成功：', error.message);
  }

  // 测试基本调用
  console.log('\n2. 测试基本调用');
  try {
    console.log('发送请求...');
    console.log('Agent ID:', process.env.BEDROCK_AGENT_ID);
    console.log('Agent Alias ID:', process.env.BEDROCK_AGENT_ALIAS_ID);
    
    const response = await client.processInput('你好，请介绍一下产品的特点', {
      agentId: process.env.BEDROCK_AGENT_ID,
      agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID,
      sessionId: 'test-session-1'
    });
    
    console.log('\n✅ 测试成功');
    console.log('----------------------------------------');
    console.log('响应内容：');
    if (response.content) {
      console.log(response.content);
    } else {
      console.log('警告：没有接收到响应内容');
    }
    
    console.log('\n引用信息：');
    if (response.citations && response.citations.length > 0) {
      console.log(JSON.stringify(response.citations, null, 2));
    } else {
      console.log('没有引用信息');
    }
    
    console.log('\n追踪信息：');
    if (response.trace) {
      console.log(JSON.stringify(response.trace, null, 2));
    } else {
      console.log('没有追踪信息');
    }
    console.log('----------------------------------------');
  } catch (error) {
    console.log('❌ 测试失败：', error.message);
  }

  // 测试流式响应
  console.log('\n3. 测试流式响应');
  try {
    await client.processInputWithStream(
      '这个产品的价格是多少？',
      {
        agentId: process.env.BEDROCK_AGENT_ID,
        agentAliasId: process.env.BEDROCK_AGENT_ALIAS_ID,
        sessionId: 'test-session-2',
        onProgress: (result) => {
          console.log('\n收到流式响应：');
          console.log('- 内容：', result.content);
          if (result.citations.length > 0) {
            console.log('- 引用：', JSON.stringify(result.citations, null, 2));
          }
          if (result.trace) {
            console.log('- 追踪：', JSON.stringify(result.trace, null, 2));
          }
        }
      }
    );
    console.log('✅ 测试成功：流式响应完成');
  } catch (error) {
    console.log('❌ 测试失败：', error.message);
  }

  // 测试错误处理
  console.log('\n4. 测试错误处理（无效的Agent ID）');
  try {
    await client.processInput('测试消息', {
      agentId: 'invalid-agent-id',
      agentAliasId: 'invalid-alias-id',
      sessionId: 'test-session-3'
    });
    console.log('❌ 测试失败：应该抛出错误');
  } catch (error) {
    console.log('✅ 测试成功：捕获到错误', error.message);
  }
}

// 运行测试
console.log('开始测试 BedrockClient...');
testBedrockClient()
  .then(() => console.log('\n所有测试完成'))
  .catch(error => console.error('\n测试过程中出现错误：', error))
  .finally(() => process.exit());
