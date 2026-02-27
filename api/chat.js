// Vercel Serverless Function - 调用 Minimax API
import { readFileSync } from 'fs';
import { join } from 'path';

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

    // 尝试读取skill文件，按需加载
    const skillContent = getSkillContent(feature);
    if (skillContent) {
      minimaxMessages.unshift({
        role: 'system',
        content: skillContent
      });
    }

    const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.5',
        messages: minimaxMessages,
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.base_resp?.status_msg || 'API请求失败');
    }

    const data = await response.json();

    // 兼容不同的返回格式
    if (data.choices && data.choices.length > 0) {
      const content = data.choices[0].message?.content || data.choices[0]?.content || data.choices[0]?.text;
      return res.status(200).json({
        content: content,
        id: data.id
      });
    } else {
      throw new Error('API返回数据格式错误: ' + JSON.stringify(data));
    }

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: error.message || '服务器错误'
    });
  }
}

// 按需读取skill文件
function getSkillContent(feature) {
  const skillFiles = {
    1: '1-interview.md',
    2: '2-storytelling.md',
    3: '3-expand.md',
    4: '4-tts.md',
    5: '5-topic.md',
    6: '6-visual.md'
  };

  const filename = skillFiles[feature];
  if (!filename) {
    return getDefaultPrompt();
  }

  try {
    // 读取skills目录下的文件
    const filePath = join(process.cwd(), 'skills', filename);
    const content = readFileSync(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('读取skill文件失败:', error);
    return getDefaultPrompt();
  }
}

// 默认提示
function getDefaultPrompt() {
  return `你是彪哥IP内容助手徐名彪。食安坚守者、海实利食品总裁。

【六大功能】
1.采访策划 2.内容改写 3.标题扩展 4.语音合成 5.选题推荐 6.素材推荐

请询问用户需要什么帮助。
【规则】专业睿智、正向能量、禁止低俗攻击`;
}
