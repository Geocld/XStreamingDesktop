<p align="center">
  <a href="https://github.com/Geocld/XStreaming">
    <img src="https://raw.githubusercontent.com/Geocld/XStreaming/main/images/logo.png" width="546">
  </a>
</p>

<p align="center">
  开源 Xbox/云游戏串流应用.
</p>

## 简介

XStreaming 是一款开源的 Xbox/云游戏串流移动端客户端，借鉴了 [Greenlight](https://github.com/unknownskl/greenlight) 提供的 API 接口和相关实现。

> 声明：XStreaming 与 Microsoft、Xbox 没有关联。所有权和商标属于其各自所有者。

## Android

在 Android 平台你可以使用 [XStreaming](https://github.com/Geocld/XStreaming)。

## 功能

- 跨平台，支持 Windows、macOS、Linux
- 串流 Xbox One、Xbox Series X|S 的音视频
- 支持 1080P 分辨率
- 支持外接、蓝牙手柄，支持手柄振动
- 支持手柄按键映射
- 免代理云游戏
- IPv6 优先连接支持
- 扳机振动

<img src="https://raw.githubusercontent.com/Geocld/XStreaming-desktop/main/images/console.jpg" /> 
<img src="https://raw.githubusercontent.com/Geocld/XStreaming-desktop/main/images/xcloud.jpg" />
<img src="https://raw.githubusercontent.com/Geocld/XStreaming-desktop/main/images/xcloud2.jpg" />
<img src="https://raw.githubusercontent.com/Geocld/XStreaming-desktop/main/images/settings.jpg" />

## Steam Deck

### 从Flathub安装
`XStreaming`已经上架Flathub，你可以直接在SteamDeck的桌面模式，使用应用商店（Discover）直接搜索XStreaming即可下载安装和后续的更新。

[![Build/release](https://flathub.org/assets/badges/flathub-badge-en.svg)](https://flathub.org/apps/io.github.Geocld.XStreamingDesktop)


### 手动安装
手动安装请参阅 [XStreaming Steam Deck 指南](./wiki/steam-deck/README.zh_CN.md)

## 本地开发

### 环境要求
- [NodeJs](https://nodejs.org/) >= 18
- [Yarn](https://yarnpkg.com/) >= 1.22

### 共建计划

欢迎加入[共建计划](https://github.com/Geocld/XStreaming/issues/45)

### 运行项目

克隆本项目到本地:

```
git clone https://github.com/Geocld/XStreaming-desktop
cd XStreaming-desktop
```
安装依赖:

```
yarn
```

启动开发模式:

```
npm run dev
```

## 开发者

XStreaming 的发展离不开这些 Hacker 们，他们贡献了大量能力，也欢迎关注他们 ❤️

<!-- readme: contributors -start -->
<table>
<tr>
    <td align="center">
        <a href="https://github.com/Geocld">
            <img src="https://avatars.githubusercontent.com/u/13679095?v=4" width="90;" alt="Geocld"/>
            <br />
            <sub><b>Geocld</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/TigerBeanst">
            <img src="https://avatars.githubusercontent.com/u/3889846?v=4" width="90;" alt="TigerBeanst"/>
            <br />
            <sub><b>TigerBeanst</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/Sirherobrine23">
            <img src="https://avatars.githubusercontent.com/u/50121801?v=4" width="90;" alt="Sirherobrine23"/>
            <br />
            <sub><b>Sirherobrine23</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/liamharper2453">
            <img src="https://avatars.githubusercontent.com/u/25060863?v=4" width="90;" alt="liamharper2453"/>
            <br />
            <sub><b>liamharper2453</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/xAbdoAT">
            <img src="https://avatars.githubusercontent.com/u/160148781?v=4" width="90;" alt="xAbdoAT"/>
            <br />
            <sub><b>xAbdoAT</b></sub>
        </a>
    </td>
  </tr>
</table>
<!-- readme: contributors -end -->

### 开源协议

XStreaming 遵循 [MIT 协议](./LICENSE).
