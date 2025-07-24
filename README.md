# chishenmo
🍽️ 吃什么？摇一摇！

一个基于 Cloudflare Worker 的多人实时食物选择转盘应用。

## 功能特性

- 🎯 **多人协作**: 多个用户可以同时加入同一个转盘
- 🔄 **实时同步**: 页面实时轮询更新，所有用户看到相同状态
- 🎲 **权重随机**: 重复添加的食物权重更高，增加被选中概率
- 📱 **响应式设计**: 支持手机和桌面端访问
- 💾 **数据持久化**: 使用 Cloudflare KV 存储数据
- 📊 **历史记录**: 查看转盘历史结果
- 🎨 **现代化UI**: 美观的转盘动画和用户界面

## 使用说明

1. **创建转盘**: 点击"初始化新转盘"创建一个新的转盘
2. **加入转盘**: 输入转盘编号加入已有转盘
3. **添加食物**: 每个用户只能添加一种食物，但可以修改
4. **开始转动**: 任何用户都可以点击开始转动
5. **查看结果**: 转动结束后显示随机选择的食物

## 技术实现

- **前端**: 原生 HTML/CSS/JavaScript
- **后端**: Cloudflare Worker
- **存储**: Cloudflare KV
- **实时更新**: 轮询机制 (2秒间隔)

## 部署步骤

1. 安装依赖:
```bash
npm install
```

2. 创建 KV 命名空间:
```bash
wrangler kv:namespace create "FOOD_KV"
wrangler kv:namespace create "FOOD_KV" --preview
```

3. 更新 `wrangler.toml` 中的 KV 命名空间 ID

4. 本地开发:
```bash
npm run dev
```

5. 部署到生产环境:
```bash
npm run deploy
```

## 项目结构

```
chishenmo/
├── src/
│   └── index.js          # 主应用文件
├── package.json          # 项目配置
├── wrangler.toml         # Cloudflare Worker 配置
└── README.md            # 项目说明
```

## API 接口

- `GET /` - 返回主页面
- `POST /api/init` - 初始化新转盘
- `GET /api/wheel/{id}` - 获取转盘数据
- `POST /api/wheel/{id}` - 更新转盘数据 (添加食物/开始转动/设置结果)

## 特色功能

### 权重系统
- 每个食物初始权重为 1
- 用户修改食物时权重 +1
- 转盘随机时按权重概率选择

### 用户控制
- 使用 localStorage 记录用户在每个转盘的参与状态
- 每个转盘每个用户只能添加一种食物
- 添加后只能修改，不能删除或添加其他食物

### 实时同步
- 2秒轮询获取最新数据
- 转动状态实时同步
- 多用户协作无冲突