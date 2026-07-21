[🇬🇧 English](README.md) · [🇫🇷 Français](README.fr.md) · [🇪🇸 Español](README.es.md) · 🇨🇳 **中文** · [🇮🇹 Italiano](README.it.md) · [🇳🇱 Nederlands](README.nl.md) · [🇩🇪 Deutsch](README.de.md)

# 🏎️ F1 UNO Élite — 卡牌收藏追踪器

**一款离线优先、可安装的集换式卡牌收藏追踪应用，使用原生 JavaScript 构建，零运行时依赖——没有框架、没有 SDK、没有 CDN、也不需要后端。**

[![tests](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml/badge.svg)](https://github.com/Arts44/f1-uno-elite/actions/workflows/tests.yml)
![License: MIT](https://img.shields.io/badge/license-MIT-green)
![PWA](https://img.shields.io/badge/PWA-installable%20%2B%20offline%20%E2%9C%93-brightgreen)
![Zero runtime deps](https://img.shields.io/badge/runtime%20dependencies-0-blue)
![Vanilla JS](https://img.shields.io/badge/JavaScript-vanilla-f7df1e?logo=javascript&logoColor=black)
![i18n](https://img.shields.io/badge/languages-7-purple)

## ▶️ **[在线试用 → arts44.github.io/f1-uno-elite](https://arts44.github.io/f1-uno-elite/)**

它是一款 **PWA**：从浏览器安装后即可像原生应用一样运行，完全离线，并拥有自己的图标——桌面端和移动端均可。

![收藏网格 — 深色主题](screenshots/grid-desktop-dark.jpg)

| 卡牌详情 — 动态闪卡类型 | 统计面板 |
|---|---|
| ![卡牌弹窗](screenshots/modal-dark.jpg) | ![统计视图](screenshots/stats-light.jpg) |

<sub>更多截图见 [`screenshots/`](screenshots/) — 浅色/深色主题、移动端。</sub>

---

## ✨ 功能一览

追踪一套完整的 **F1 UNO Élite** 集换式卡牌收藏（101 张卡牌，每张最多 16 种变体——基础颜色、闪卡、双色闪、Wild、Nitro、促销卡）：

- 📇 **完整的收藏管理** — 已拥有 / 重复 / 愿望清单 / 收藏夹，支持按变体计数、即时搜索和深度筛选。
- ✨ **6 级动态稀有度系统** — `epic → legendary → mythic → ultra → cosmic → divine`，根据已拥有的最佳变体自动计算；闪卡带有流动的光泽效果，最高级别以流转的虹彩渐变呈现（全部遵循 `prefers-reduced-motion`）。
- 📴 **完全离线可用** — 整个应用由 Service Worker 预缓存；首次访问后，开启飞行模式也毫无影响。
- 🔄 **无感自动更新** — 后台检测新版本，在一个低调的横幅上轻点一下即可应用，并附带应用内更新日志（「自*你的*上一版本以来的新变化」）。
- 🌍 **7 种语言** — 英语、法语、西班牙语、中文、意大利语、荷兰语、德语。每一条文本、徽章和更新日志条目。
- 🎓 **26 步交互式教程** — 一场引导之旅，让你*亲手执行*真实操作，运行在沙盒中，结束时撤销所有改动。
- 🏅 **50 个徽章与称号** — 25 个根据可测条件自动解锁，25 个自行申报。
- 📊 **统计面板** — 总体进度、稀有度环形图、按类别的完成度、亮点卡牌，以及逐日进度曲线（纯 SVG，无图表库）。
- 🔁 **无处不在的备份** — JSON 导出/导入、压缩的设备间**备份码**、同一备份码的可扫描 **QR 码**版本，以及可选的**云端备份**（Supabase）。
- 🔐 **PIN 锁、访客模式与可选加密** — 4 位 PIN（SHA-256）、用于分享的只读模式，以及可选的收藏静态加密（PBKDF2 + AES-GCM，密钥由 PIN 派生——原生 Web Crypto）。
- 🤝 **藏家工具** — 缺卡 / 重复卡 / 交换清单，可带去卡牌交换会。
- 💬 **应用内反馈** — 已登录用户可直接从设置中发送建议或错误报告。

---

## 🛠️ 技术栈

| 领域 | 选型 |
|---|---|
| 语言 | **原生 JavaScript**（原生 ES 模块）、HTML5、CSS3 — 无框架 |
| 运行时依赖 | **零。** 运行时没有 npm 包、没有 CDN、没有 SDK |
| 构建 | [esbuild](https://esbuild.github.io/)（*唯一*的 devDependency）→ 一个压缩的 IIFE 包 |
| 离线 / PWA | 手写 Service Worker（版本化预缓存、cache-first 外壳）+ Web App Manifest |
| 云端（可选） | **Supabase，纯 REST `fetch()`** — 无 SDK；邮箱 OTP 验证码认证，行级安全（RLS） |
| 加密 | 原生 **Web Crypto** — SHA-256（PIN）、PBKDF2 + AES-GCM（可选静态加密） |
| QR 码 | 内置的单文件编码器（[Project Nayuki](https://www.nayuki.io/page/qr-code-generator-library)，MIT） |
| 字体 | 自托管 WOFF2（SIL OFL）— 无 Google Fonts 请求，5 种可切换字体主题 |
| 测试 | **Node 内置测试运行器**（`node --test`）— 166 个测试，无测试框架 |
| CI | GitHub Actions — 每次 push/PR 运行测试 + 构建 + 已提交产物的新鲜度校验 |

**零运行时依赖是一条设计规则，而非偶然。** 框架或 SDK 通常提供的一切——渲染、视图间导航、i18n、离线缓存、REST 认证、加密、QR 生成——都直接基于 Web 平台 API 实现。你安装的应用就是这个仓库里的代码，分毫不差。

---

## 🧗 技术挑战

真正塑造了这套代码的问题，以及它们的解法：

### 既离线优先，*又*始终保持最新
**问题：** cache-first 的 Service Worker 让应用离线时坚如磐石——也让它极其擅长永远提供过期代码。已安装的 PWA 受影响最重：它们可能数天保持打开而没有一次导航，浏览器因此永远不会主动重新检查 Worker。
**解法：** 新 Worker 在后台下载并刻意停在 *waiting* 状态（不自动 `skipWaiting`——在运行中的应用脚下偷换外壳正是破坏状态的方式）。应用显示一个一键式「新版本 — 重新加载」横幅，通过 `SKIP_WAITING` 消息将其转正；被忽略的横幅会在下次冷启动时自然生效。已安装的 PWA 还会在每次回到前台时以及每小时调用 `registration.update()`。应用版本派生自最新的更新日志条目：发布*就是*写更新日志——版本与历史不可能脱节。

### 在已安装的 PWA 中也能用的邮箱登录
**问题：** 经典的魔法链接（magic link）认证在已安装的 PWA 中会失效：链接在默认浏览器中打开——那是另一个存储分区——会话落在了应用不在的地方。
**解法：** 认证以**邮箱 OTP 验证码**为主路径：验证码直接输入应用本身，因此会话每次都创建在正确的上下文中。魔法链接保留为浏览器侧的附加方式。整个 GoTrue 流程（发送、验证、刷新、过期余量）用纯 `fetch()` 实现——没有 Supabase SDK。

### 一个永不碰 API 的 Service Worker
**问题：** 一个拦截所有请求的预缓存 Service Worker 会心安理得地从缓存里返回 API 响应——一个只在生产环境出现的静默数据损坏 bug。
**解法：** Worker 完全排除 Supabase 源（请求原样放行不拦截），云端调用还额外带上 `cache: 'no-store'`。双重保险，并有测试验证。

### 一次被逐字节证明无变化的 CSS 重构
**问题：** 把数百个硬编码的间距值迁移到设计令牌（design tokens），而唯一的保证只有「我看着没变」。
**解法：** 只做精确匹配替换（绝不四舍五入到最近的令牌），然后给出证明：把重构前后两份样式表中的每个 `var()` 都解析为像素值，再逐字节比较——渲染在数学上完全一致；不在刻度上的值保持原样并列入清单，留待日后有意为之的一轮处理。

### 带邮件通知的反馈功能——没有服务器
**问题：** 维护者希望应用内的每条反馈都能收到一封邮件，但没有后端来发送。
**解法：** `feedback` 表上的一个 Postgres 触发器通过 `pg_net` 调用 Resend API，整个过程都在 Supabase 内部完成。API 密钥加密存放在 Supabase Vault 中（绝不进入本仓库），用户内容经过 HTML 转义，邮件失败也绝不会阻塞插入。客户端有冷却时间；服务端有 SQL 限流（每用户每小时最多 5 条），由触发器强制执行。

### 没有 i18n 库的 7 种语言
**问题：** 每一条用户可见的文本——界面、徽章、教程、更新日志条目、错误信息——都要有 7 种语言，却没有框架来强制纪律。
**解法：** 一个基于字典文件的小巧 `t()` 辅助函数、用于静态 HTML 的 `data-i18n` 属性，以及一旦更新日志条目缺少 7 种语言中任何一种就会失败的单元测试。英语是声明的兜底语言；项目的硬性规则是：只有英文的文本就是一次不完整的改动。

### 不用浏览器来测试一个浏览器应用
**问题：** 坚守零依赖的承诺意味着排除 Jest、Vitest 和无头浏览器测试装置。
**解法：** 逻辑被重构为与浏览器无关（稀有度计算、存储迁移、备份编码、统计、徽章、加密、云端辅助函数、更新逻辑等），并由 **Node 内置运行器上的 166 个测试**覆盖——零测试依赖、无真实网络（每个云端测试都对 `fetch` 打桩）。CI 还会重新构建产物包，若已提交的构建产物过期即失败：部署的代码可证明与源码一致。

---

## 🚀 快速上手

一个现代浏览器加任意静态 HTTP 服务器（`file://` 不行——ES 模块和 JSON 的 `fetch()` 在那里都被阻止）。

```bash
# 开发 — 无需构建，直接使用原生 ES 模块：
python3 -m http.server 8000
# → http://localhost:8000/index-dev.html

# 生产构建：
npm install     # 安装 esbuild，唯一的 devDependency
npm run build   # app.js → app.bundle.js（压缩 + sourcemap）
# → http://localhost:8000/  （index.html）

# 测试：
npm test        # 166 个测试，node --test，无框架
```

### 部署

仓库**原样**部署到 GitHub Pages（纯静态，无服务端构建）：所有 URL 均为相对路径，因此应用在域名根路径、子路径和 localhost 下运行完全一致。构建产物随仓库提交，因为 Pages 不执行任何 npm 步骤；CI 保证它永不过期。发布流程：添加一条更新日志条目（这*就是*版本号提升）→ 提升 `sw.js` 中的 `SW_VERSION` → 构建 → 推送。回访用户会看到更新横幅。

---

## ⚖️ 坦诚的局限

- **PIN 是界面层面的屏障，不是强安全。** 未开启可选加密时，收藏数据可通过 DevTools 在 `localStorage` 中直接读取。开启加密后，随手窥探被挡住了——但 4 位 PIN 对持有设备的人来说可以离线暴力破解。它防的是顺手的好奇心，不是专家。忘记 PIN 会让加密的本地收藏无法恢复——请保留备份。
- **云端登录运行在测试邮件域名上。** 认证和反馈邮件目前通过默认/测试发件域名发送，速率限制很严——对个人项目足够，但不是生产级的邮件投递。自定义 SMTP/域名可以解除这一限制。
- **进度历史无法回溯补齐** — 统计曲线从该功能安装当天才开始；没有按卡牌的时间戳可用于重建过去。

---

## 📜 许可证与商标

以 **MIT 许可证**发布 — 见 [LICENSE](LICENSE)。© 2026 Arthur。

> 「F1」和「UNO」以及车队/车手的标志与图片均归其各自所有者所有。这是一个**非官方**的个人收藏追踪工具，与 Formula 1、Mattel 或任何车队均无从属、认可或赞助关系。
