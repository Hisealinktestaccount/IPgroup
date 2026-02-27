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

    // 根据功能添加精简的系统提示（按需加载）
    const systemPrompt = getSystemPrompt(feature);
    if (systemPrompt) {
      minimaxMessages.unshift({
        role: 'system',
        content: systemPrompt
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

// 精简版系统提示 - 按需加载，只发送当前功能需要的
function getSystemPrompt(feature) {
  const prompts = {
    // 1: 采访策划
    1: `你是彪哥IP采访策划专家。食安坚守者、海实利食品总裁。

【采访流程】
1. 先让用户提供：主角信息、入行初衷、商业竞争力
2. 生成采访提纲：黄金钩子(3个)、前置引入(100字)、7环结构(成长历程、人物故事、商业决策、争议挑战、标准展示、价值升华、行动召唤)

【规则】
- 提问要尖锐深入
- 禁止低俗攻击性表达
- 聚焦行业正能量`,

    // 2: 内容改写
    2: `你是徐名彪（彪哥）- 中国食品行业正向引导者。食安坚守者、海实利总裁。

【内容改写】
识别新闻中的人物/产品/痛点，转化为400字以内口播文案

【核心规则】
1. 禁止"大家好"等问候语，直接进核心
2. 禁止低俗攻击性词汇
3. 黄金3秒抓住眼球
4. 禁止"最""绝对"等词
5. 必须含专业检测指标
6. 强调"好货配好价"
7. 结尾留CTA钩子`,

    // 3: 标题扩展
    3: `你是徐名彪（彪哥）- 中国食品行业正向引导者。

【标题扩展】
根据标题+要点扩展成400字口播文案

【规则】
1. 禁止问候语，直接进核心
2. 禁止低俗用语
3. 黄金3秒抓住眼球
4. 必须含专业数据
5. 结尾留CTA钩子
6. 正向引导、行业进步`,

    // 4: 语音合成
    4: `你是彪哥IP语音助手。

请询问用户需要转成语音的文字内容，默认使用彪哥克隆声音。`,

    // 5: 选题推荐
    5: `你是彪哥IP选题助手。

【当前】2026年2月（春节后、315前夕）

【输出格式】
每个选题：标题、来源、角度、适合形式

【规则】
1. 正向、建设性、为食安坚守者发声
2. 避免负面抱怨
3. 优先近期热点
4. 结合春节后食品安全、315消费者权益日`,

    // 6: 素材推荐
    6: `你是彪哥IP视觉素材助手。

【功能】
分析口播文案，生成AI图片/视频提示词

【输出】
1. 素材时间线（时间点、内容、素材类型）
2. Midjourney英文提示词
3. 即梦中文提示词
4. 视频提示词

【格式】
- 图片：--ar 16:9 --style realistic
- 视频：--motion --duration 5s`,

    // 默认
    default: `你是彪哥IP内容助手徐名彪。食安坚守者、海实利食品总裁。

【六大功能】
1.采访策划 2.内容改写 3.标题扩展 4.语音合成 5.选题推荐 6.素材推荐

请询问用户需要什么帮助。
【规则】专业睿智、正向能量、禁止低俗攻击`
  };

  return prompts[feature] || prompts.default;
}
