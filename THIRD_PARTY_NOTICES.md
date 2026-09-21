# 第三方组件与许可

本个人主页的游戏采用独立 iframe 入口。原作者及许可文件保留，适配后的未压缩源码就在对应目录中。

## Hextris

- 原项目：https://github.com/Hextris/hextris
- 固定提交：`3f4847dc8fd7dab3d1c87e6324b9159d92fbd396`
- 许可：GPL-3.0-or-later，完整许可见 `games/hextris/LICENSE.md`
- 作者：Logan Engstrom、Garrett Finucane、Noah Moroze、Michael Yang
- 本地适配说明：`games/hextris/LOCAL-CHANGES.md`

## 0h h1

- 原作：Q42 / Martin Kool，Copyright 2014 Q42
- 本次来源：https://github.com/florisluiten/0hh1 ，为历史 fork，并非当前官方发布版本
- 固定提交：`25910e580d6ea6bc1dfbfd29b2637e47844a96f9`
- 许可：MIT，完整许可见 `games/0hh1/LICENSE`
- 本地适配说明：`games/0hh1/LOCAL-CHANGES.md`
- jQuery 2.1.0：(c) jQuery Foundation and other contributors，MIT，见 `games/0hh1/JQUERY-LICENSE.txt`

适配日期：2026-09-05。游戏均为本地静态资源，无广告或分数上传；各自保持原有玩法，补充中文操作说明。

## 知识图谱布局

图谱使用 D3 的力导向布局模块，复用 Horizon 已安装的官方 npm 包，打包为本地静态资源 `vendor/d3-force.js`，无需 CDN 或额外网络请求。界面、交互和统计逻辑在本主页中独立实现。

- d3-force 3.0.0：https://github.com/d3/d3-force
- d3-dispatch、d3-quadtree、d3-timer 为布局依赖。
- ISC 许可；版本、版权声明和完整许可保留于 `vendor/D3-LICENSES.txt`。
- 适配日期：2026-09-07。

## 天机簿 · Tianji Bu (formerly Wenchen / Bazi Lab)

MIT © 2026 zhuyep. Source: https://github.com/zhuyep/mingli-lab

A local static build is included at `games/wenchen/`. That directory includes the project's LICENSE, upstream lunar-typescript MIT notices, and a SOURCE.json recording the source revision and build checksums. No lecture PDFs or transcripts are included.
