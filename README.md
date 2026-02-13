# 璟岩信息·星穹 (StarLink) SRM

面向中小型制造业的轻量化、智能化供应链协同 SaaS 平台。

## 产品定位

解决中小型制造业（采购团队<10人，供应商30-50家）的供应链协同痛点，构建可实际运行的 SaaS 系统。

## 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 前端 | React 18 + Vite + Tailwind CSS | Apple Design 风格 |
| 后端 | Node.js + Express | RESTful API |
| 数据库 | SQLite (开发) / PostgreSQL (生产) | 轻量化起步 |
| AI | MiniMax M2.1 API | 文本生成、数据提取 |
| 认证 | JWT + 微信 OAuth | 双端认证 |
| 部署 | Docker + Nginx | 容器化部署 |

## 快速开始

### 前置要求

- Node.js 18+
- npm 9+

### 安装与运行

```bash
# 使用初始化脚本
bash init.sh

# 或者手动安装
cd frontend && npm install
cd ../backend && npm install

# 启动后端
cd backend && npm run dev

# 启动前端 (新终端)
cd frontend && npm run dev
```

### 访问地址

- PC端: http://localhost:5173
- 移动端: http://localhost:5173/mobile

### 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 采购员 | purchaser | purchase123 |
| 供应商-华威机械 | huawei | huawei123 |
| 供应商-立讯电子 | lixun | lixun123 |
| 财务 | finance | finance123 |

## 功能模块

### PC 管理端

- 工作台：数据统计、待办事项
- 订单管理：创建、编辑、状态流转
- 供应商管理：CRUD、状态管理
- 寻源中心：询价发布、报价比较
- 财务协同：对账管理、发票处理

### 移动协同端 (H5)

- 订单通知与处理
- 接单、发货操作
- 发票上传
- 对账确认

### AI 智能功能

- 自然语言建单
- 询价需求润色
- 对账智能稽核
- 发票 OCR 识别

## 项目结构

```
starlink-srm/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── components/       # 通用组件
│   │   ├── pages/            # 页面
│   │   ├── hooks/            # 自定义Hooks
│   │   ├── services/         # API服务
│   │   ├── stores/           # 状态管理
│   │   └── utils/            # 工具函数
│   └── ...
│
├── backend/                  # 后端项目
│   ├── src/
│   │   ├── controllers/      # 控制器
│   │   ├── services/         # 业务逻辑
│   │   ├── models/           # 数据模型
│   │   ├── routes/           # 路由定义
│   │   ├── middlewares/      # 中间件
│   │   └── ai/               # AI服务
│   ├── database/
│   │   ├── migrations/      # 数据库迁移
│   │   └── seeds/            # 种子数据
│   └── ...
│
├── docker-compose.yml
├── Dockerfile
├── init.sh
└── README.md
```

## 开发规范

- 使用 Feature List 进行测试驱动开发
- 所有功能测试用例保存在 `feature_list.json`
- 遵循 RESTful API 设计规范
- 前端采用组件化开发

## 许可证

Proprietary - All rights reserved
