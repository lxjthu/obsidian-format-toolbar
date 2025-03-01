# Obsidian 格式工具栏插件

一个用于 Obsidian 的格式工具栏插件，支持文本样式设置、颜色调整、高亮标记和表格创建等功能，让你的笔记更加丰富多彩。

## 主要功能

1. **字体设置**
   - 支持多种中文字体（宋体、黑体、微软雅黑、楷体、仿宋）
   - 字体大小可调节（8-72px）
   - 需确保系统已安装相应字体

2. **文本颜色**
   - 提供丰富的预设颜色（蓝色系、红色系、绿色系、紫色系、中性色系）
   - 支持选中文本快速上色

3. **文本高亮**
   - 多种半透明高亮颜色可选
   - 支持高亮颜色的切换和取消

4. **表格工具**
   - 快速创建表格
   - 可设置行数和列数（1-10）
   - 支持表格对齐方式设置（左对齐、居中、右对齐）

5. **其他功能**
   - 复选框：快速插入待办事项
   - 链接：创建外部链接和内部链接
   - 双向链接：便捷创建笔记间的关联
   - 文本格式：支持加粗、斜体等样式
   - 时间戳：插入当前时间

## 安装方法

1. 下载最新版本的发布包
2. 解压到 Obsidian 插件目录：`.obsidian/plugins/`
3. 在 Obsidian 设置中启用插件

### 字体安装说明

为了使用全部字体功能，请确保您的系统已安装以下开源字体：

### 开源字体下载

1. 思源字体系列（Adobe）
   - [思源宋体](https://github.com/adobe-fonts/source-han-serif/releases)
   - [思源黑体](https://github.com/adobe-fonts/source-han-sans/releases)
   - [思源等宽](https://github.com/adobe-fonts/source-han-mono/releases)

2. LXGW字体系列
   - [霞鹜文楷/LXGW WenKai](https://github.com/lxgw/LxgwWenKai/releases)
   - [未来荧黑/LXGW Neo XiHei](https://github.com/lxgw/LxgwNeoXiHei/releases)

3. 其他优秀开源字体
   - [得意黑](https://github.com/atelier-anchor/smiley-sans/releases)
   - [站酷系列](https://www.zitijia.com/i/tag/站酷)

### 字体安装说明

#### Windows 系统
1. 下载字体文件（.ttf 或 .otf 格式）
2. 右键点击字体文件，选择"安装"
3. 等待安装完成

#### macOS 系统
1. 下载字体文件
2. 双击字体文件
3. 点击"安装字体"按钮

#### Linux 系统
1. 下载字体文件
2. 将字体文件复制到 `~/.local/share/fonts/` 目录
3. 运行 `fc-cache -f -v` 刷新字体缓存

## 使用说明

### 基本操作

1. **字体设置**
   - 选择文本后，点击字体名称应用字体
   - 使用 +/- 按钮或直接输入数字调整字体大小

2. **颜色设置**
   - 选择文本后，点击颜色块应用文本颜色
   - 点击高亮色块为文本添加背景色
   - 再次点击相同的高亮色块可取消高亮

3. **表格创建**
   - 设置所需的行数和列数
   - 选择表格对齐方式
   - 点击创建表格按钮插入表格

## 问题反馈

如果你发现任何问题或有功能建议，欢迎：
1. 提交 [Issue](https://github.com/lxjthu/obsidian-format-toolbar/issues)
2. 发起 [Pull Request](https://github.com/lxjthu/obsidian-format-toolbar/pulls)

## 许可证

[MIT License](LICENSE)
