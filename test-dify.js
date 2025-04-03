const { agentStreamCall, workflowCall } = require('./DifyClient');

// API密钥配置
const API_KEYS = {
  workflow: 'app-mbik6gmDdG2uvDOdCW9DXN9u',
  agent: 'app-k4HKQ1qy2aAo6vPjBeYXNo4v'
};

async function testDify() {
  console.log('开始测试 Dify API...');
  
  try {
    // 测试工作流模式的多个场景
    const workflowTests = [
      {
        scenario: '基础对话',
        message: '你好，请介绍一下自己'
      }
    ];

    for (const test of workflowTests) {
      console.log(`\n测试工作流模式 - ${test.scenario}:`);
      console.log(`发送消息: "${test.message}"`);
      const response = await workflowCall(test.message, API_KEYS.workflow);
      console.log(`工作流响应 (${test.scenario}):`);
      console.log('运行ID:', response.workflow_run_id);
      console.log('任务ID:', response.task_id);
      console.log('状态:', response.data.status);
      console.log('输出:', response.data.outputs);
      if (response.data.error) {
        console.log('错误:', response.data.error);
      }
      console.log('耗时:', response.data.elapsed_time, '秒');
      console.log('Token数:', response.data.total_tokens);
      console.log('步骤数:', response.data.total_steps);
      console.log('开始时间:', response.data.created_at);
      console.log('完成时间:', response.data.finished_at);
    }

    console.log('\n测试Agent流式模式:');
    console.log('发送消息: "你能做什么？"');
    const agentResponse = await agentStreamCall('你能做什么？', API_KEYS.agent, (chunk) => {
      if (chunk.event === 'agent_thought') {
        process.stdout.write('\n思考过程: ' + chunk.content);
      } else {
        process.stdout.write('\n回答: ' + chunk.content);
      }
    });
    
    console.log('\n\nAgent流式响应完成');
    console.log('完整响应:', agentResponse);
  } catch (error) {
    console.error('测试失败!');
    console.error('错误详情:', error);
    console.error('错误堆栈:', error.stack);
    if (error.response) {
      console.error('API 响应:', error.response.data);
    }
    // 确保错误被正确传播
    throw error;
  }
}

// 运行测试并确保程序不会立即退出
testDify().catch(error => {
  console.error('未捕获的错误:', error);
  process.exit(1);
});
