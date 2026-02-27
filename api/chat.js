// Vercel Serverless Function - 调用 Minimax API
export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, feature } = req.body;

    // 从环境变量获取API Key
    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API Key未配置' });
    }

    // 构建发送给Minimax的请求
    const minimaxMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // 根据功能添加系统提示
    const systemPrompt = getSystemPrompt(feature);
    if (systemPrompt) {
      minimaxMessages.unshift({
        role: 'system',
        content: systemPrompt
      });
    }

    const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_pro', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'abab6.5s-chat',
        messages: minimaxMessages,
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.base_resp?.status_msg || 'API请求失败');
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      return res.status(200).json({
        content: data.choices[0].message.content,
        id: data.id
      });
    } else {
      throw new Error('API返回数据格式错误');
    }

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: error.message || '服务器错误'
    });
  }
}

function getSystemPrompt(feature) {
  const prompts = {
    1: '你是彪哥IP的内容助手，擅长采访策划。请用专业、友好的风格帮助用户策划采访提纲。',
    2: '你是彪哥IP的内容助手，擅长将新闻内容改写成口播文案。请保持彪哥IP的独特风格。',
    3: '你是彪哥IP的内容助手，擅长扩展标题为完整的口播文案。请确保内容有深度、有吸引力。',
    4: '的内容助手，负责你是彪哥IP语音合成。请提供清晰、适合配音的文案。',
    5: '你是彪哥IP的内容助手，擅长推荐选题。请结合食品安全行业热点推荐有价值的话题。',
    6: '你是彪哥IP的内容助手，擅长素材推荐。请分析文案内容，给出合适的AI绘画/视频提示词。'
  };
  return prompts[feature] || '你是彪哥IP的内容助手，请用专业、友好的风格回复用户。';
}
