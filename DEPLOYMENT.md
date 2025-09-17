# Chrome Translation Extension - 部署指南

## 发布准备清单

### 代码准备
- [ ] 所有功能开发完成并测试通过
- [ ] 代码审查完成
- [ ] 性能优化完成
- [ ] 错误处理完善
- [ ] 文档更新完整

### 构建准备
- [ ] 依赖项更新到稳定版本
- [ ] TypeScript编译无错误
- [ ] 构建脚本测试通过
- [ ] 发布版本构建成功

### 资源准备
- [ ] 图标文件完整（16x16, 32x32, 48x48, 128x128）
- [ ] 截图和宣传图片准备
- [ ] 说明文档完整
- [ ] 许可证文件包含

## 构建发布版本

### 1. 环境检查
```bash
# 检查Node.js版本
node --version  # 应该 >= 16.0.0

# 检查npm版本
npm --version   # 应该 >= 8.0.0

# 检查TypeScript版本
npx tsc --version  # 应该 >= 5.0.0
```

### 2. 依赖安装
```bash
# 清理node_modules
rm -rf node_modules package-lock.json

# 重新安装依赖
npm install

# 检查安全漏洞
npm audit
```

### 3. 代码检查
```bash
# TypeScript类型检查
npx tsc --noEmit

# 代码格式检查（如果配置了）
npm run lint

# 运行测试（如果有）
npm test
```

### 4. 构建发布版本
```bash
# 清理旧的构建文件
npm run clean

# 构建发布版本
npm run build-release
```

构建完成后会生成：
- `release/` 目录：包含所有发布文件
- `chrome-translation-extension-v1.0.0.zip`：Chrome Web Store上传包

### 5. 验证构建结果
```bash
# 检查发布目录结构
ls -la release/

# 验证必要文件存在
ls release/manifest.json
ls release/dist/
ls release/icons/
ls release/popup/
ls release/options/
ls release/content/
```

## Chrome Web Store 发布

### 1. 开发者账户准备
1. **注册开发者账户**
   - 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - 使用Google账户登录
   - 支付一次性注册费用（$5）

2. **验证身份**
   - 完成开发者身份验证
   - 提供必要的联系信息

### 2. 应用信息准备

#### 基本信息
- **名称**: Chrome Translation Extension
- **简短描述**: 快速翻译工具：支持输入框翻译、选中文本翻译和网页全文翻译
- **详细描述**: 
```
Chrome Translation Extension 是一款功能强大的翻译工具，使用Chrome内置翻译API提供高质量的翻译服务。

主要功能：
• 输入框翻译 - 在扩展弹窗中输入任意文本进行翻译
• 选中文本翻译 - 选中网页文本，显示悬浮翻译窗口  
• 网页全文翻译 - 一键翻译整个网页，支持流式更新
• 智能语言检测 - 自动识别源语言，无需手动选择
• 多语言支持 - 支持英语、中文、日语、韩语等多种语言
• 实时进度显示 - 翻译过程中显示进度和状态信息
• 缓存机制 - 避免重复翻译，提升响应速度

特色功能：
✓ 流式翻译输出，实时查看翻译结果
✓ 批量处理大量文本，高效翻译整个网页
✓ 智能错误处理和重试机制
✓ 响应式设计，适配不同屏幕尺寸
✓ 一键复制翻译结果
✓ 恢复原文功能

使用Chrome内置翻译API，确保翻译质量和隐私安全。
```

#### 分类和标签
- **主要分类**: 生产力工具
- **标签**: 翻译, 语言, 工具, 生产力, 国际化

#### 图标和截图
- **应用图标**: 128x128 PNG格式
- **小图标**: 16x16, 32x32, 48x48 PNG格式
- **截图**: 至少3张，展示主要功能
- **宣传图片**: 1280x800 或 640x400

### 3. 上传和发布

#### 上传扩展包
1. 在开发者控制台点击"新增项目"
2. 上传 `chrome-translation-extension-v1.0.0.zip`
3. 等待自动检查完成

#### 填写商店信息
1. **隐私政策**
   - 如果收集用户数据，需要提供隐私政策链接
   - 本扩展不收集个人数据，可选择"不收集用户数据"

2. **权限说明**
   - `activeTab`: 访问当前标签页内容进行翻译
   - `storage`: 保存用户设置和翻译偏好

3. **目标受众**
   - 选择"所有年龄段"
   - 不包含成人内容

#### 提交审核
1. 检查所有信息填写完整
2. 点击"提交审核"
3. 等待Google审核（通常1-3个工作日）

## 手动分发

### 1. 创建分发包
```bash
# 构建发布版本
npm run build-release

# 创建用户安装包
cp -r release chrome-translation-extension-manual
zip -r chrome-translation-extension-manual.zip chrome-translation-extension-manual/
```

### 2. 安装说明文档
创建 `INSTALL.md` 文件：

```markdown
# Chrome Translation Extension - 手动安装指南

## 安装步骤

1. 下载并解压 chrome-translation-extension-manual.zip
2. 打开Chrome浏览器
3. 访问 chrome://extensions/
4. 开启右上角的"开发者模式"
5. 点击"加载已解压的扩展程序"
6. 选择解压后的文件夹
7. 扩展安装完成

## 使用说明

安装完成后，点击浏览器工具栏中的扩展图标开始使用。

详细使用说明请参考 README.md 文件。
```

### 3. 分发渠道
- GitHub Releases
- 官方网站下载
- 企业内部分发
- 开发者社区

## 版本管理

### 版本号规则
使用语义化版本控制 (Semantic Versioning)：
- **主版本号**: 不兼容的API修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

### 更新流程
1. **代码更新**
   ```bash
   # 更新版本号
   npm version patch  # 或 minor, major
   
   # 更新manifest.json中的版本号
   # 提交代码变更
   git add .
   git commit -m "Release v1.0.1"
   git tag v1.0.1
   git push origin main --tags
   ```

2. **构建新版本**
   ```bash
   npm run build-release
   ```

3. **发布更新**
   - Chrome Web Store: 上传新版本zip包
   - GitHub: 创建新的Release
   - 更新文档和说明

## 监控和维护

### 发布后监控
1. **Chrome Web Store 指标**
   - 安装量和活跃用户
   - 用户评分和评论
   - 崩溃报告

2. **用户反馈**
   - GitHub Issues
   - 用户评论
   - 支持邮箱

3. **性能监控**
   - 扩展性能指标
   - API调用成功率
   - 错误日志分析

### 维护计划
1. **定期更新**
   - 安全补丁
   - 功能改进
   - 兼容性更新

2. **用户支持**
   - 及时回复用户反馈
   - 修复报告的问题
   - 提供使用帮助

3. **文档维护**
   - 更新使用说明
   - 维护开发文档
   - 更新兼容性信息

## 故障排除

### 常见发布问题

#### 1. 构建失败
```bash
# 检查TypeScript错误
npx tsc --noEmit

# 检查依赖问题
npm install
npm audit fix
```

#### 2. Chrome Web Store 审核被拒
- 检查权限使用是否合理
- 确保隐私政策完整
- 验证功能描述准确
- 检查图标和截图质量

#### 3. 用户安装问题
- 提供详细安装说明
- 检查Chrome版本兼容性
- 验证权限申请正确

### 应急处理
1. **紧急下架**
   - 在Chrome Web Store控制台下架
   - 通知用户停止使用
   - 修复问题后重新发布

2. **快速修复**
   - 创建hotfix分支
   - 快速修复关键问题
   - 发布补丁版本

---

**部署检查清单完成后，即可开始发布流程。**