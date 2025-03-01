import { Plugin, MarkdownView, Notice, WorkspaceLeaf, ItemView, Editor } from 'obsidian';
import { createPopper } from '@popperjs/core';
import Pickr from '@simonwep/pickr';

// 定义工具栏视图类型
const FORMAT_TOOLBAR_VIEW = 'format-toolbar-view';

// 工具栏视图类
class FormatToolbarView extends ItemView {
    private plugin: FormatToolbarPlugin;
    private eventListeners: { [key: string]: (e: KeyboardEvent) => void } = {};
    private selectedFont: string = 'SimSun';
    private selectedFontSize: string = '16px';
    private selectedColor: string = '#000000';
    private selectedHighlightColor: string = '#ffeb3b';
    private tableRows: number = 3;
    private tableCols: number = 3;
    private tableAlign: string = 'left';
    private lastActiveEditor: any = null;

    constructor(leaf: WorkspaceLeaf, plugin: FormatToolbarPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return FORMAT_TOOLBAR_VIEW;
    }

    getDisplayText(): string {
        return '格式工具栏';
    }

    public checkEditorState(): { valid: boolean; editor: any } | null {
        const { workspace } = this.plugin.app;
        
        // 获取活动视图和编辑器
        const activeView = workspace.getActiveViewOfType(MarkdownView);
        
        // 如果有活动的编辑器，更新缓存
        if (activeView?.editor) {
            this.lastActiveEditor = activeView.editor;
        }
        
        // 优先使用缓存的编辑器
        if (this.lastActiveEditor) {
            return { valid: true, editor: this.lastActiveEditor };
        }
        
        // 如果没有缓存的编辑器，尝试获取当前活动的编辑器
        if (!activeView || !activeView.editor) {
            console.log('检查编辑器状态: 无活动的编辑器');
            new Notice('请在编辑器中使用此功能');
            return null;
        }

        return { valid: true, editor: activeView.editor };
    }

    private registerEditorEvents() {
        const workspace = this.plugin.app.workspace;

        // 监听编辑器变化
        this.plugin.registerEvent(
            workspace.on('editor-change', () => {
                console.log('编辑器内容变化事件触发');
                const editorState = this.checkEditorState();
                if (editorState) {
                    const selection = editorState.editor.getSelection();
                    console.log('当前选中的文本:', selection);
                    
                    // 获取当前光标位置
                    const cursor = editorState.editor.getCursor();
                    console.log('当前光标位置:', cursor);
                }
            })
        );

        // 监听活动编辑器变化
        this.plugin.registerEvent(
            workspace.on('active-leaf-change', () => {
                console.log('活动编辑器切换事件触发');
                const editorState = this.checkEditorState();
                if (editorState) {
                    const cursor = editorState.editor.getCursor();
                    console.log('编辑器切换后的光标位置:', cursor);

                    // 获取编辑器实例信息
                    console.log('编辑器实例信息:', {
                        editor: editorState.editor,
                        hasEditor: editorState.editor ? true : false
                    });
                }
            })
        );
    }
    
    async onOpen() {
        const container = this.containerEl.children[1] as HTMLElement;
        container.empty();
        container.addClass('format-toolbar');
    
        const toolbarContainer = container.createDiv('format-toolbar-container');
        
        // 创建格式化按钮
        this.createFormatButtons(toolbarContainer);
        
        // 创建设置区域
        const settingsContainer = toolbarContainer.createDiv('format-toolbar-settings');
        this.createSettingsPanel(settingsContainer);
        
        // 创建表格按钮
        this.createTableButton(settingsContainer);
    
        // 注册编辑器事件监听
        this.registerEditorEvents();
    }

    private createFormatButtons(container: HTMLElement) {
        // 创建按钮组容器
        const buttonGroup = container.createDiv('button-group');

        // 创建双向链接按钮
        const wikiLinkButton = buttonGroup.createDiv('link-button');
        wikiLinkButton.setAttribute('aria-label', '插入双向链接');
        wikiLinkButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
        
        wikiLinkButton.addEventListener('click', () => {
            const editorState = this.checkEditorState();
            if (!editorState) return;

            const editor = editorState.editor;
            const selection = editor.getSelection();

            if (selection) {
                // 如果有选中文本，将其转换为双向链接格式
                editor.replaceSelection(`[[${selection}]]`);
            } else {
                // 如果没有选中文本，插入空的双向链接并将光标定位到中间
                const cursor = editor.getCursor();
                editor.replaceRange('[[]]', cursor);
                editor.setCursor({
                    line: cursor.line,
                    ch: cursor.ch + 2
                });
            }
        });

        // 创建复选框按钮
        const checkboxButton = buttonGroup.createDiv('checkbox-button');
        checkboxButton.setAttribute('aria-label', '插入复选框');
        checkboxButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/><path d="M18 9l-1.4-1.4-6.6 6.6-2.6-2.6L6 13l4 4z"/></svg>';
        checkboxButton.addEventListener('click', () => {
            const editorState = this.checkEditorState();
            if (!editorState) return;

            const editor = editorState.editor;
            const cursor = editor.getCursor();
            editor.replaceRange('- [ ] ', cursor);
            editor.focus();
        });

        // 创建普通链接按钮
        const linkButton = buttonGroup.createDiv('link-button');
        linkButton.setAttribute('aria-label', '插入链接');
        linkButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>';
        linkButton.addEventListener('click', () => {
            const editorState = this.checkEditorState();
            if (!editorState) return;

            const editor = editorState.editor;
            const selection = editor.getSelection();
            if (selection) {
                editor.replaceSelection(`[${selection}]()`);
                const cursor = editor.getCursor();
                editor.setCursor(cursor.line, cursor.ch - 1);
            } else {
                const cursor = editor.getCursor();
                editor.replaceRange('[]()', cursor);
                editor.setCursor(cursor.line, cursor.ch + 1);
            }
            editor.focus();
        });

        // 创建加粗按钮
        const boldButton = buttonGroup.createDiv('link-button');
        boldButton.setAttribute('aria-label', '加粗');
        boldButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>';
        boldButton.addEventListener('click', () => {
            const editorState = this.checkEditorState();
            if (!editorState) return;

            const editor = editorState.editor;
            const selection = editor.getSelection();
            if (selection) {
                editor.replaceSelection(`**${selection}**`);
            } else {
                const cursor = editor.getCursor();
                editor.replaceRange('****', cursor);
                editor.setCursor(cursor.line, cursor.ch + 2);
            }
            editor.focus();
        });

        // 创建斜体按钮
        const italicButton = buttonGroup.createDiv('link-button');
        italicButton.setAttribute('aria-label', '斜体');
        italicButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>';
        italicButton.addEventListener('click', () => {
            const editorState = this.checkEditorState();
            if (!editorState) return;

            const editor = editorState.editor;
            const selection = editor.getSelection();
            if (selection) {
                editor.replaceSelection(`*${selection}*`);
            } else {
                const cursor = editor.getCursor();
                editor.replaceRange('**', cursor);
                editor.setCursor(cursor.line, cursor.ch + 1);
            }
            editor.focus();
        });

        // 创建时间按钮
        const timeButton = buttonGroup.createDiv('link-button');
        timeButton.setAttribute('aria-label', '插入当前时间');
        timeButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/></svg>';
        timeButton.addEventListener('click', () => {
            const editorState = this.checkEditorState();
            if (!editorState) return;

            const editor = editorState.editor;
            const now = new Date();
            const timeString = now.toLocaleTimeString('zh-CN', { hour12: false });
            const cursor = editor.getCursor();
            editor.replaceRange(timeString, cursor);
            editor.focus();
        });

    }

    private createSettingsPanel(container: HTMLElement) {
        // 字体设置
        const fontSection = container.createDiv('settings-section');
        fontSection.createSpan({ text: '字体:', cls: 'settings-label' });
        const fontGrid = fontSection.createDiv('font-grid');
        const fonts = [
            { name: '宋体', family: 'SimSun' },
            { name: '黑体', family: 'SimHei' },
            { name: '微软雅黑', family: 'Microsoft YaHei' },
            { name: '楷体', family: 'KaiTi' },
            { name: '仿宋', family: 'FangSong' },
            { name: '华康海报体', family: 'DFPHaiBaoW12' },
            { name: '方正卡通体', family: 'FZKaTong-M19' },
            { name: '华康少女体', family: 'DFPShaoNvW5' },
            { name: '华康圆体', family: 'DFPYuanW5' },
            { name: '方正娃娃体', family: 'FZWaWaW-GB1' }
        ];
        fonts.forEach(font => {
            const fontItem = fontGrid.createDiv('font-item');
            fontItem.setText(font.name);
            fontItem.style.fontFamily = font.family;
            fontItem.addEventListener('click', () => {
                this.selectedFont = font.family;
                const editorState = this.checkEditorState();
                if (!editorState) return;

                const selection = editorState.editor.getSelection();
                if (selection) {
                    // 检查是否已有字体标记
                    const fontRegex = /<span style="font-family: [^;]+; font-size: [^;]+">(.*?)<\/span>/;
                    const match = selection.match(fontRegex);

                    if (match) {
                        // 如果已有字体标记，更新字体
                        const innerText = match[1];
                        const sizeMatch = match[0].match(/font-size: ([^;]+)/);
                        const currentSize = sizeMatch ? sizeMatch[1] : this.selectedFontSize;
                        editorState.editor.replaceSelection(
                            `<span style="font-family: ${font.family}; font-size: ${currentSize}">${innerText}</span>`
                        );
                    } else {
                        // 如果没有字体标记，直接应用新字体
                        editorState.editor.replaceSelection(
                            `<span style="font-family: ${font.family}; font-size: ${this.selectedFontSize}">${selection}</span>`
                        );
                    }
                    editorState.editor.focus();
                }
            });
        });

        // 字体大小设置
        const fontSizeSection = container.createDiv('settings-section');
        fontSizeSection.createSpan({ text: '大小:', cls: 'settings-label' });
        const fontSizeControls = fontSizeSection.createDiv('font-size-controls');

        // 减小字号按钮
        const decreaseButton = fontSizeControls.createEl('button', {
            cls: 'font-size-button',
            text: '-'
        });

        // 字号输入框
        const fontSizeInput = fontSizeControls.createEl('input', {
            type: 'number',
            cls: 'font-size-input',
            value: parseInt(this.selectedFontSize).toString(),
            attr: { min: '8', max: '72', step: '1' }
        });

        // 增加字号按钮
        const increaseButton = fontSizeControls.createEl('button', {
            cls: 'font-size-button',
            text: '+'
        });

        // 字号更新函数
        const updateFontSize = (newSize: number) => {
            newSize = Math.max(8, Math.min(72, newSize));
            this.selectedFontSize = `${newSize}px`;
            fontSizeInput.value = newSize.toString();

            const editorState = this.checkEditorState();
            if (!editorState) return;

            const selection = editorState.editor.getSelection();
            if (selection) {
                // 检查是否已有字体标记
                const fontRegex = /<span style="font-family: [^;]+; font-size: [^;]+">(.*?)<\/span>/;
                const match = selection.match(fontRegex);

                if (match) {
                    // 如果已有字体标记，更新字号
                    const innerText = match[1];
                    const fontMatch = match[0].match(/font-family: ([^;]+)/);
                    const currentFont = fontMatch ? fontMatch[1] : this.selectedFont;
                    editorState.editor.replaceSelection(
                        `<span style="font-family: ${currentFont}; font-size: ${newSize}px">${innerText}</span>`
                    );
                } else {
                    // 如果没有字体标记，只应用字号
                    editorState.editor.replaceSelection(
                        `<span style="font-size: ${newSize}px">${selection}</span>`
                    );
                }
                editorState.editor.focus();
            }
        };

        // 绑定事件
        decreaseButton.addEventListener('click', () => {
            const currentSize = parseInt(fontSizeInput.value);
            updateFontSize(currentSize - 1);
        });

        increaseButton.addEventListener('click', () => {
            const currentSize = parseInt(fontSizeInput.value);
            updateFontSize(currentSize + 1);
        });

        fontSizeInput.addEventListener('change', () => {
            const newSize = parseInt(fontSizeInput.value);
            updateFontSize(newSize);
        });

        // 颜色设置
        const colorSection = container.createDiv('settings-section');
        colorSection.createSpan({ text: '颜色:', cls: 'settings-label' });
        const colorGrid = colorSection.createDiv('color-grid');
        const colors = [
            // 红色系列
            '#D32F2F', '#EF5350',
            // 橙色系列
            '#F57C00', '#FB8C00',
            // 黄色系列
            '#FBC02D', '#FFD54F',
            // 青色系列
            '#00ACC1', '#26C6DA',
            // 蓝色系列
            '#1976D2', '#42A5F5',
            // 紫色系列
            '#7B1FA2', '#AB47BC',
            // 棕色系列
            '#5D4037', '#8D6E63',
            // 黑色系列
            '#212121', '#424242',
            // 灰色系列
            '#757575', '#BDBDBD'
        ];

        colors.forEach(color => {
            const colorItem = colorGrid.createDiv('color-item');
            colorItem.style.backgroundColor = color;
            colorItem.addEventListener('click', () => {
                this.selectedColor = color;
                const editorState = this.checkEditorState();
                if (!editorState) return;

                const selection = editorState.editor.getSelection();
                if (selection) {
                    editorState.editor.replaceSelection(
                        `<span style="color: ${color}">${selection}</span>`
                    );
                } else {
                    const cursor = editorState.editor.getCursor();
                    editorState.editor.replaceRange(
                        `<span style="color: ${color}">`,
                        cursor
                    );
                    const endPos = editorState.editor.getCursor();
                    editorState.editor.replaceRange('</span>', endPos);
                    editorState.editor.setCursor(endPos);
                }
            });
        });

        // 高亮颜色设置
        const highlightSection = container.createDiv('settings-section');
        highlightSection.createSpan({ text: '高亮:', cls: 'settings-label' });
        const highlightGrid = highlightSection.createDiv('color-grid');
        const highlightColors = [
            'rgba(255, 235, 59, 0.5)',   // 淡黄色
            'rgba(255, 193, 7, 0.5)',    // 琥珀色
            'rgba(255, 152, 0, 0.5)',    // 橙色
            'rgba(255, 87, 34, 0.5)',    // 深橙色
            'rgba(244, 67, 54, 0.5)',    // 红色
            'rgba(233, 30, 99, 0.5)',    // 粉红色
            'rgba(156, 39, 176, 0.5)',   // 紫色
            'rgba(103, 58, 183, 0.5)'    // 深紫色
        ];

        let activeHighlight: HTMLElement | null = null;

        highlightColors.forEach(color => {
            const highlightItem = highlightGrid.createDiv('color-item');
            highlightItem.style.backgroundColor = color;
            highlightItem.addEventListener('click', () => {
                const editorState = this.checkEditorState();
                if (!editorState) return;

                if (activeHighlight === highlightItem) {
                    // 取消高亮状态
                    activeHighlight.classList.remove('active');
                    activeHighlight = null;
                    return;
                }

                if (activeHighlight) {
                    activeHighlight.classList.remove('active');
                }
                activeHighlight = highlightItem;
                activeHighlight.classList.add('active');

                const selection = editorState.editor.getSelection();
                if (selection) {
                    editorState.editor.replaceSelection(
                        `<span style="background-color: ${color}">${selection}</span>`
                    );
                } else {
                    const cursor = editorState.editor.getCursor();
                    editorState.editor.replaceRange(
                        `<span style="background-color: ${color}">`,
                        cursor
                    );
                    const endPos = editorState.editor.getCursor();
                    editorState.editor.replaceRange('</span>', endPos);
                    editorState.editor.setCursor(endPos);
                }
            });
        });

        // // 复选框和链接按钮
        // const buttonSection = container.createDiv('settings-section');
        // buttonSection.createSpan({ text: '工具:', cls: 'settings-label' });
        // const buttonContainer = buttonSection.createDiv('button-container');

        // // 创建复选框按钮
        // const checkboxButton = buttonContainer.createDiv('checkbox-button');
        // checkboxButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/><path d="M18 9l-1.4-1.4-6.6 6.6-2.6-2.6L6 13l4 4z"/></svg>';
        // checkboxButton.addEventListener('click', () => {
        //     const editorState = this.checkEditorState();
        //     if (!editorState) return;

        //     const editor = editorState.editor;
        //     const cursor = editor.getCursor();
        //     editor.replaceRange('- [ ] ', cursor);
        //     editor.focus();
        // });

        // // 创建链接按钮
        // const linkButton = buttonContainer.createDiv('link-button');
        // linkButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>';
        // linkButton.addEventListener('click', () => {
        //     const editorState = this.checkEditorState();
        //     if (!editorState) return;

        //     const editor = editorState.editor;
        //     const selection = editor.getSelection();
        //     if (selection) {
        //         editor.replaceSelection(`[${selection}]()`);
        //         const cursor = editor.getCursor();
        //         editor.setCursor(cursor.line, cursor.ch - 1);
        //     } else {
        //         const cursor = editor.getCursor();
        //         editor.replaceRange('[]()', cursor);
        //         editor.setCursor(cursor.line, cursor.ch + 1);
        //     }
        //     editor.focus();
        // });

        // 表格设置
        const tableSection = container.createDiv('settings-section table-settings');
        tableSection.createSpan({ text: '表格:', cls: 'settings-label' });
        
        const rowsInput = tableSection.createEl('input', {
            type: 'number',
            cls: 'table-input',
            value: this.tableRows.toString(),
            attr: { min: '1', max: '10' }
        });
        tableSection.createSpan({ text: '行' });
        
        const colsInput = tableSection.createEl('input', {
            type: 'number',
            cls: 'table-input',
            value: this.tableCols.toString(),
            attr: { min: '1', max: '10' }
        });
        tableSection.createSpan({ text: '列' });

        const alignSelect = tableSection.createEl('select', { cls: 'table-align-select' });
        const alignOptions = [
            { value: 'left', text: '左对齐' },
            { value: 'center', text: '居中' },
            { value: 'right', text: '右对齐' }
        ];
        alignOptions.forEach(option => {
            alignSelect.createEl('option', {
                value: option.value,
                text: option.text
            });
        });

        rowsInput.addEventListener('change', () => {
            this.tableRows = parseInt(rowsInput.value) || 3;
        });

        colsInput.addEventListener('change', () => {
            this.tableCols = parseInt(colsInput.value) || 3;
        });

        alignSelect.addEventListener('change', () => {
            this.tableAlign = alignSelect.value;
        });
    }

    private createFontButton(container: HTMLElement) {
        const button = container.createEl('button', {
            cls: 'format-toolbar-button',
            text: '字体'
        });
    
        button.onclick = async () => {
            console.log('字体按钮被点击');
            const editorState = this.checkEditorState();
            if (!editorState) return;
    
            const selection = editorState.editor.getSelection();
            console.log('选中的文本:', selection);
            if (!selection) {
                new Notice('请先选择要格式化的文本');
                return;
            }
    
            // 保存当前光标位置
            const cursor = editorState.editor.getCursor();
    
            editorState.editor.replaceSelection(
                `<span style="font-family: ${this.selectedFont}; font-size: ${this.selectedFontSize}">${selection}</span>`
            );
            
            // 恢复光标位置
            editorState.editor.setCursor(cursor);
            editorState.editor.focus();
        };
    }

    private createColorButton(container: HTMLElement) {
        const button = container.createEl('button', {
            cls: 'format-toolbar-button',
            text: '颜色'
        });
    
        button.onclick = async () => {
            const editorState = this.checkEditorState();
            if (!editorState) return;
    
            const selection = editorState.editor.getSelection();
            if (!selection) {
                new Notice('请先选择要格式化的文本');
                return;
            }

            // 保存当前光标位置
            const cursor = editorState.editor.getCursor();

            // 优化颜色标记的正则表达式，处理嵌套情况
            const colorRegex = /<span style="color: #[0-9a-fA-F]{6}">((?:(?!<\/span>).)*)<\/span>/g;
            let text = selection;
            let match;

            // 递归移除所有颜色标记
            while ((match = colorRegex.exec(text)) !== null) {
                text = text.replace(match[0], match[1]);
                colorRegex.lastIndex = 0; // 重置正则表达式的匹配位置
            }

            // 应用新的颜色标记
            editorState.editor.replaceSelection(
                `<span style="color: ${this.selectedColor}">${text}</span>`
            );
            
            // 恢复光标位置
            editorState.editor.setCursor(cursor);
            editorState.editor.focus();
        };
    }

    private createHighlightButton(container: HTMLElement) {
        const button = container.createEl('button', {
            cls: 'format-toolbar-button',
            text: '高亮'
        });
    
        button.onclick = async () => {
            const editorState = this.checkEditorState();
            if (!editorState) return;
    
            const selection = editorState.editor.getSelection();
            if (!selection) {
                new Notice('请先选择要格式化的文本');
                return;
            }

            // 保存当前光标位置
            const cursor = editorState.editor.getCursor();

            // 检查是否已有高亮标记
            const highlightRegex = /<span style="background-color: #[0-9a-fA-F]{6}">(.*?)<\/span>/;
            const match = selection.match(highlightRegex);

            if (match) {
                // 如果已有高亮标记，先移除原有标记
                const innerText = match[1];
                if (this.selectedHighlightColor === match[0].match(/#[0-9a-fA-F]{6}/)[0]) {
                    // 如果选择的颜色与当前颜色相同，则只移除标记
                    editorState.editor.replaceSelection(innerText);
                } else {
                    // 如果选择了不同的颜色，则应用新颜色
                    editorState.editor.replaceSelection(
                        `<span style="background-color: ${this.selectedHighlightColor}">${innerText}</span>`
                    );
                }
            } else {
                // 如果没有高亮标记，直接应用新颜色
                editorState.editor.replaceSelection(
                    `<span style="background-color: ${this.selectedHighlightColor}">${selection}</span>`
                );
            }
            
            // 恢复光标位置
            editorState.editor.setCursor(cursor);
            editorState.editor.focus();
        };
    };

    private createTableButton(container: HTMLElement) {
        const button = container.createEl('button', {
            cls: 'format-toolbar-button',
            text: '添加表格'
        });

        button.onclick = async () => {
            const editorState = this.checkEditorState();
            if (!editorState) return;

            const selection = editorState.editor.getSelection();
            const cursor = editorState.editor.getCursor();
            let tableContent = '';

            if (selection) {
                // 尝试将选中的文本转换为表格
                const rows = selection.split('\n').map((row: string) => row.split('\t'));
                const maxCols = Math.max(...rows.map((row: string) => row.length));
                
                // 创建表头
                tableContent = '|' + ' '.repeat(this.tableAlign === 'center' ? 2 : 1);
                for (let i = 0; i < maxCols; i++) {
                    tableContent += `列 ${i + 1} `;
                    tableContent += '|' + ' '.repeat(this.tableAlign === 'center' ? 2 : 1);
                }
                tableContent += '\n|';

                // 创建对齐行
                for (let i = 0; i < maxCols; i++) {
                    switch (this.tableAlign) {
                        case 'left':
                            tableContent += ':--------|';
                            break;
                        case 'center':
                            tableContent += ':--------:|';
                            break;
                        case 'right':
                            tableContent += '--------:|';
                            break;
                    }
                }
                tableContent += '\n';

                // 填充数据
                rows.forEach((row: string[]) => {
                    tableContent += '|';
                    for (let i = 0; i < maxCols; i++) {
                        tableContent += ` ${row[i] || ''} |`;
                    }
                    tableContent += '\n';
                });
            } else {
                // 创建空表格
                // 创建表头
                tableContent = '|' + ' '.repeat(this.tableAlign === 'center' ? 2 : 1);
                for (let i = 0; i < this.tableCols; i++) {
                    tableContent += `列 ${i + 1} `;
                    tableContent += '|' + ' '.repeat(this.tableAlign === 'center' ? 2 : 1);
                }
                tableContent += '\n|';

                // 创建对齐行
                for (let i = 0; i < this.tableCols; i++) {
                    switch (this.tableAlign) {
                        case 'left':
                            tableContent += ':--------|';
                            break;
                        case 'center':
                            tableContent += ':--------:|';
                            break;
                        case 'right':
                            tableContent += '--------:|';
                            break;
                    }
                }
                tableContent += '\n';

                // 创建空行
                for (let i = 0; i < this.tableRows; i++) {
                    tableContent += '|';
                    for (let j = 0; j < this.tableCols; j++) {
                        tableContent += '   |';
                    }
                    tableContent += '\n';
                }
            }

            // 将表格内容插入到编辑器中
            editorState.editor.replaceSelection(tableContent);
            
            // 恢复光标位置
            editorState.editor.setCursor(cursor);
            editorState.editor.focus();
        };
    }
}

export default class FormatToolbarPlugin extends Plugin {
    private view: FormatToolbarView | null = null;

    async onload() {
        console.log('正在加载格式工具栏插件...');

        // 注册视图
        this.registerView(
            FORMAT_TOOLBAR_VIEW,
            (leaf: WorkspaceLeaf) => {
                this.view = new FormatToolbarView(leaf, this);
                return this.view;
            }
        );

        // 添加功能按钮
        this.addRibbonIcon('text', '格式工具栏', () => {
            this.activateView();
        });
    }

    async onunload() {
        console.log('正在卸载格式工具栏插件...');
        this.app.workspace.detachLeavesOfType(FORMAT_TOOLBAR_VIEW);
    }

    private async activateView() {
        const { workspace } = this.app;

        // 确保有活动的编辑器
        const activeView = workspace.getActiveViewOfType(MarkdownView);
        if (!activeView) {
            new Notice('请先打开一个Markdown文件');
            return;
        }

        // 如果视图已经打开，就激活它
        let existingLeaf = workspace.getLeavesOfType(FORMAT_TOOLBAR_VIEW)[0];
        if (existingLeaf) {
            workspace.revealLeaf(existingLeaf);
            // 等待视图完全加载
            await new Promise(resolve => setTimeout(resolve, 300));
            return;
        }

        // 否则，创建新的视图
        let newLeaf = workspace.getLeaf('split', 'vertical');
        if (newLeaf) {
            await newLeaf.setViewState({
                type: FORMAT_TOOLBAR_VIEW,
                active: true,
            });

            workspace.revealLeaf(newLeaf);
            // 等待视图完全加载并确保编辑器状态正确
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // 重新检查编辑器状态
            const editorState = this.view?.checkEditorState();
            if (!editorState) {
                new Notice('无法获取编辑器状态，请重试');
                return;
            }
        }
    }
}
                    