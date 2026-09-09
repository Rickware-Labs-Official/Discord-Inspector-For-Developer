<div align="center">

# 🕵️‍♂️ Rickware - Labs© Discord Inspector V3

### The Ultimate Browser-Based Dev & Analysis Tool for Discord Web

[![Discord](https://img.shields.io/badge/Discord-Join%20Server-7289da?logo=discord&logoColor=white)](https://discord.gg/Wk7d8mJgyN)
[![License](https://img.shields.io/github/license/Dev-Rick-C137/discord-inspector?color=blue)](LICENSE)
[![Stars](https://img.shields.io/github/stars/Dev-Rick-C137/discord-inspector?color=yellow)](https://github.com/Dev-Rick-C137/discord-inspector/stargazers)
[![Forks](https://img.shields.io/github/forks/Dev-Rick-C137/discord-inspector?color=orange)](https://github.com/Dev-Rick-C137/discord-inspector/network/members)
[![Last Commit](https://img.shields.io/github/last-commit/Dev-Rick-C137/discord-inspector)](https://github.com/Dev-Rick-C137/discord-inspector/commits/main)

</div>

---

## 📖 About

Welcome to **Rickware - Labs© Discord Inspector V3** — a powerful, free, and open-source browser script designed specifically for developers, modders, and researchers to analyze the Discord Web Client directly within the browser.

> ℹ️ **Note:** This tool injects a custom floating UI and a dedicated sidebar tab into the Discord web interface, giving you unprecedented access to React fibers, Webpack modules, and the DOM.

## 📑 Table of Contents

- [Features](#-features)
- [Installation & Usage](#-installation--usage)
- [Core Modules](#-core-modules)
- [Preview](#-preview)
- [Credits](#-credits)
- [Contributing](#-contributing)
- [License](#-license)
- [Community & Support](#-community--support)

## ✨ Features

- ⚛️ **React Analysis:** Read internal React fibers, components, hierarchy, props, states, and hooks.
- 📦 **Webpack & Flux Search:** Browse internal modules and Flux stores, previewing source code and exported properties.
- 🔍 **Advanced Element Inspection:** Search by ID, Class, Tag, Text, or CSS Selectors. Copy HTML, XPath, or CSS paths instantly.
- 👻 **Reveal Hidden Elements:** Instantly unhide content blocked by `display: none` or `opacity: 0` via the Reveal Mode.
- 🎯 **Pick Mode & Live Watch:** Target elements with a click (`Alt + Shift + I`) and monitor real-time DOM mutations.
- 📡 **Code Scanner:** Capture and search through HTML, JS, CSS, images, and background network requests.
- 🔓 **Auto De-hash:** Automatically translates cryptic, obfuscated Discord class names into readable terms.

## 🚀 Installation & Usage

The Inspector is a JavaScript file (`main.js`) that runs directly in your browser. You can use it via a Userscript manager or inject it manually.

### Method 1: Userscript Manager (Recommended)
1. Install an extension like [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Create a new script in your extension and paste the contents of `main.js`.
3. Save the script and open [Discord Web](https://discord.com/app). The Inspector UI and sidebar tab will appear automatically.

### Method 2: Developer Console
1. Open [Discord Web](https://discord.com/app) in your browser.
2. Open the Developer Tools (`F12` or `Ctrl+Shift+I`).
3. Navigate to the **Console** tab.
4. Copy the entire code from `main.js`, paste it into the console, and press `Enter`.

## 🧩 Core Modules

| Module | Description | Status |
|---|---|---|
| **DOM Inspector** | Inspect size, tags, attributes, and generate XPath/CSS selectors. | ✅ Active |
| **React DevTools** | Extract Ancestor Trees, Props, States, and Hooks from selected elements. | ✅ Active |
| **Webpack Explorer** | Deep search into loaded modules and Flux stores. | ✅ Active |
| **Asset Scanner** | Logs and indexes loaded JS, CSS, images, and network calls. | ✅ Active |

## 🖼️ Preview

<div align="center">

*A quick look at the Discord Inspector V3 in action.*

| Main Dashboard | React Fiber Analysis | Webpack Explorer |
|:---:|:---:|:---:|
| ![preview-1](https://via.placeholder.com/400x250/2f3136/ffffff?text=Dashboard+UI) | ![preview-2](https://via.placeholder.com/400x250/2f3136/ffffff?text=React+Props+%26+States) | ![preview-3](https://via.placeholder.com/400x250/2f3136/ffffff?text=Webpack+Search) |

> *Replace these placeholder images with actual screenshots of your Inspector UI.*

</div>

## 🙏 Credits

- **Main Creator & Developer:** [Dev-Rick-C137](https://github.com/Dev-Rick-C137) — "Rickware - Labs©"

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork this repository
2. Create a new branch — `git checkout -b feature/new-inspector-tool`
3. Commit your changes — `git commit -m "Add new React extraction feature"`
4. Push to your branch — `git push origin feature/new-inspector-tool`
5. Open a Pull Request

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

## 💬 Community & Support

Need help using the Inspector, have suggestions, or want to share your custom mods? Join the Discord community or check out our launcher!

<div align="center">

[![Discord Banner](https://discord.com/api/guilds/1459796753896177676/widget.png?style=banner2)](https://discord.gg/Wk7d8mJgyN)

[![Join Discord](https://img.shields.io/badge/Join%20our%20Discord-7289da?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/Wk7d8mJgyN)
[![Launcher Website](https://img.shields.io/badge/🚀%20Launcher-Website-2ea44f?style=for-the-badge)](https://dev-rick-c137.github.io/Launcher/)

</div>

---

<div align="center">

### ⭐ If you find this tool useful, consider giving it a star!

Made with ❤️ by **[Dev-Rick-C137](https://github.com/Dev-Rick-C137)**

</div>