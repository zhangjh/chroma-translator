# Chrome Translation Extension

一个功能强大的Chrome翻译扩展，使用Chrome内置翻译API提供多种翻译方式，支持输入框翻译、选中文本翻译和网页全文翻译。

## 🌟 功能特性

### 核心功能
- ✅ **输入框翻译** - 在扩展弹窗中输入任意文本进行翻译
- ✅ **选中文本翻译** - 选中网页文本，显示悬浮翻译窗口
- ✅ **网页全文翻译** - 一键翻译整个网页，支持流式更新和进度显示
- ✅ **设置页面** - 配置默认目标语言和翻译偏好

### 智能特性
- ✅ **自动语言检测** - 智能识别源语言，无需手动选择
- ✅ **多语言支持** - 支持英语、中文、日语、韩语、法语、德语、西班牙语、俄语等
- ✅ **流式翻译** - 全文翻译时实时显示已翻译内容
- ✅ **翻译进度** - 实时显示翻译进度和状态信息
- ✅ **批量处理** - 高效的并发翻译处理机制

### 用户体验
- ✅ **一键复制** - 快速复制翻译结果
- ✅ **恢复原文** - 全文翻译后可恢复原始内容
- ✅ **错误处理** - 智能错误处理和重试机制
- ✅ **缓存机制** - 避免重复翻译，提升响应速度
- ✅ **响应式设计** - 适配不同屏幕尺寸

## 📸 功能截图

### 输入框翻译
- 点击扩展图标，在弹窗中输入文本
- 自动检测语言，选择目标语言
- 显示翻译进度和结果

### 选中文本翻译
- 在任意网页选中文本
- 自动显示翻译悬浮窗
- 快速查看翻译结果

### 网页全文翻译
- 一键翻译整个网页
- 实时显示翻译进度
- 保持页面布局不变

## 🚀 快速开始

### 用户安装指南

#### 方式一：从Chrome Web Store安装（推荐）
1. 访问Chrome Web Store
2. 搜索"Chrome Translation Extension"
3. 点击"添加至Chrome"
4. 确认安装权限

#### 方式二：手动安装开发版
1. 下载最新发布版本的zip文件
2. 解压到本地目录
3. 打开Chrome浏览器，访问 `chrome://extensions/`
4. 开启右上角的"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择解压后的目录

### 📖 使用说明

#### 1. 输入框翻译
1. **打开扩展**
   - 点击浏览器工具栏中的扩展图标
   - 或使用快捷键（可在设置中配置）

2. **输入文本**
   - 在输入框中输入或粘贴要翻译的文本
   - 系统会自动检测源语言

3. **选择目标语言**
   - 从下拉菜单选择目标语言
   - 首次选择会保存为默认语言

4. **开始翻译**
   - 点击"翻译"按钮
   - 或使用快捷键 Ctrl+Enter (Windows) / Cmd+Enter (Mac)

5. **查看结果**
   - 翻译完成后结果会显示在下方
   - 点击复制按钮可复制翻译结果

#### 2. 选中文本翻译
1. **选中文本**
   - 在任意网页上用鼠标选中要翻译的文本
   - 确保选中的文本不为空

2. **查看翻译**
   - 选中后会自动显示翻译悬浮窗
   - 悬浮窗显示翻译结果和源语言信息

3. **交互操作**
   - 点击悬浮窗外部可关闭窗口
   - 可复制翻译结果

#### 3. 网页全文翻译
1. **启动翻译**
   - 在扩展弹窗中点击"翻译整页"按钮
   - 或使用右键菜单选择"翻译此页面"

2. **观察进度**
   - 页面顶部会显示翻译进度条
   - 实时显示已翻译元素数量和百分比

3. **查看结果**
   - 已翻译的内容会实时替换原文
   - 保持页面原有布局和样式

4. **控制翻译**
   - 可随时暂停、继续或取消翻译
   - 翻译完成后可点击"恢复原文"

#### 4. 设置配置
1. **打开设置**
   - 在扩展弹窗中点击设置图标
   - 或右键扩展图标选择"选项"

2. **配置选项**
   - **默认目标语言**：设置常用的翻译目标语言
   - **翻译行为**：配置自动翻译、悬浮窗显示等
   - **快捷键**：自定义翻译快捷键

3. **保存设置**
   - 修改后点击"保存"按钮
   - 设置会立即生效

### 💡 使用技巧

#### 快捷操作
- **快速翻译**：选中文本后自动显示翻译
- **批量翻译**：全文翻译支持大量文本的高效处理
- **智能缓存**：相同文本不会重复翻译，提升速度

#### 最佳实践
- **文本长度**：单次翻译建议不超过5000字符
- **网页翻译**：复杂页面建议分段翻译
- **语言检测**：短文本可能检测不准确，可手动选择源语言

#### 故障排除
- **翻译失败**：检查网络连接和Chrome版本
- **API不可用**：确保Chrome版本支持翻译API
- **权限问题**：确认扩展已获得必要权限

## 🔧 开发者指南

### 环境要求
- Node.js 16+ 和 npm
- Chrome 88+ 浏览器
- TypeScript 5.0+

### 开发命令
```bash
# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 构建扩展
npm run build

# 构建开发版本
npm run build-dev

# 构建发布版本
npm run build-release

# 清理构建文件
npm run clean
```

### 项目结构
```
chrome-translation-extension/
├── manifest.json              # 扩展清单文件
├── popup/                     # 弹窗界面
│   ├── popup.html            # 弹窗HTML
│   └── popup.css             # 弹窗样式
├── content/                   # 内容脚本
│   └── content.css           # 内容脚本样式
├── options/                   # 设置页面
│   ├── options.html          # 设置页面HTML
│   └── options.css           # 设置页面样式
├── src/                       # TypeScript源码
│   ├── popup/                # 弹窗逻辑
│   │   └── popup.ts
│   ├── content/              # 内容脚本逻辑
│   │   └── content.ts
│   ├── background/           # 后台脚本
│   │   ├── background.ts
│   │   ├── translation-service.ts
│   │   ├── message-router.ts
│   │   └── batch-translation-manager.ts
│   ├── options/              # 设置页面逻辑
│   │   └── options.ts
│   └── shared/               # 共享模块
│       ├── cache-manager.ts
│       ├── debounce-manager.ts
│       ├── error-handler.ts
│       └── performance-monitor.ts
├── types/                     # 类型定义
│   ├── api.ts
│   ├── constants.ts
│   ├── interfaces.ts
│   └── index.ts
├── icons/                     # 扩展图标
│   ├── icon.svg
│   ├── create-icons.html
│   └── generate-png-icons.js
├── dist/                      # 编译输出
├── release/                   # 发布版本
└── build.js                   # 构建脚本
```

### 开发流程
1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd chrome-translation-extension
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **开发模式**
   ```bash
   npm run dev
   ```

4. **在Chrome中测试**
   - 访问 `chrome://extensions/`
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目根目录

5. **构建发布版本**
   ```bash
   npm run build-release
   ```

### 技术栈
- **TypeScript** - 类型安全的JavaScript
- **Chrome Extension Manifest V3** - 最新的扩展规范
- **Chrome Translation API** - Chrome内置翻译服务
- **Chrome Storage API** - 数据持久化
- **CSS3** - 现代样式设计

### 架构设计
- **Background Script** - 核心翻译逻辑和API调用
- **Content Script** - 网页内容交互和DOM操作
- **Popup** - 用户界面和输入处理
- **Options** - 设置页面和配置管理

## 🤝 贡献指南

### 报告问题
- 使用GitHub Issues报告bug
- 提供详细的复现步骤
- 包含Chrome版本和操作系统信息

### 功能建议
- 在Issues中提出新功能建议
- 描述使用场景和预期效果
- 讨论实现方案

### 代码贡献
1. Fork项目
2. 创建功能分支
3. 提交代码变更
4. 创建Pull Request

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 支持与反馈

- **问题反馈**：[GitHub Issues](https://github.com/chrome-translation-extension/issues)
- **功能建议**：[GitHub Discussions](https://github.com/chrome-translation-extension/discussions)
- **使用文档**：[Wiki](https://github.com/chrome-translation-extension/wiki)

## 🔄 版本历史

### v1.0.0 (当前版本)
- ✅ 输入框翻译功能
- ✅ 选中文本翻译
- ✅ 网页全文翻译
- ✅ 设置页面
- ✅ 多语言支持
- ✅ 智能缓存机制

### 计划中的功能
- 🔄 翻译历史记录
- 🔄 自定义快捷键
- 🔄 主题切换
- 🔄 离线翻译支持

---

**Chrome Translation Extension** - 让翻译更简单、更高效！