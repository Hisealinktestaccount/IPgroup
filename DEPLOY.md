# 部署说明

## 快速部署到 Vercel

1. **安装 Vercel CLI**（可选，也可以在网页操作）
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   vercel
   ```

4. **设置环境变量**

   在 Vercel 控制台（https://vercel.com/dashboard）中：
   - 进入你的项目 → Settings → Environment Variables
   - 添加变量：
     - Name: `MINIMAX_API_KEY`
     - Value: 你的 Minimax API Key
   - 保存后需要重新 Deploy

## 或者使用 GitHub 部署

1. 将代码推送到 GitHub
2. 访问 https://vercel.com/new 导入 GitHub 仓库
3. 在项目设置中添加环境变量 `MINIMAX_API_KEY`
4. Deploy

## 本地测试

```bash
# 安装依赖
npm init -y
npm install

# 本地运行
vercel dev
```

## 注意事项

- API Key 存储在 Vercel 环境变量中，前端代码无法看到
- Vercel 免费版每月有 125,000 次请求额度
- 如需自定义域名，在 Vercel 控制台设置
