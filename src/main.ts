import { Plugin, MarkdownView, Notice, WorkspaceLeaf, ItemView } from 'obsidian';
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
        if (!activeView || !activeView.editor) {
            console.log('检查编辑器状态: 无活动的编辑器');
            new Notice('请在编辑器中使用此功能');
            return null;
        }

        // 获取编辑器状态
        const editorState = {
            activeView: activeView,
            hasEditor: true,
            editor: activeView.editor,
            workspaceState: {
                activeLeaf: workspace.activeLeaf?.getViewState(),
                lastActiveFile: workspace.getLastOpenFiles()?.[0]
            }
        };

        console.log('检查编辑器状态:', editorState);
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
        
        // 创建按钮区域
        const buttonsContainer = toolbarContainer.createDiv('format-toolbar-buttons');
        this.createFormatButtons(buttonsContainer);
    
        // 创建设置区域
        const settingsContainer = toolbarContainer.createDiv('format-toolbar-settings');
        this.createSettingsPanel(settingsContainer);
    
        // 注册编辑器事件监听
        this.registerEditorEvents();
    }

    private createFormatButtons(container: HTMLElement) {
        // 创建格式化按钮
        this.createFontButton(container);
        this.createColorButton(container);
        this.createHighlightButton(container);
        this.createTableButton(container);
    }

    private createSettingsPanel(container: HTMLElement) {
        // 字体设置
        const fontSection = container.createDiv('settings-section');
        fontSection.createSpan({ text: '字体:', cls: 'settings-label' });
        const fontSelect = fontSection.createEl('select', { cls: 'settings-select' });
        const fonts = [
            { name: '宋体', family: 'SimSun' },
            { name: '黑体', family: 'SimHei' },
            { name: '微软雅黑', family: 'Microsoft YaHei' },
            { name: '楷体', family: 'KaiTi' },
            { name: '仿宋', family: 'FangSong' }
        ];
        fonts.forEach(font => {
            const option = fontSelect.createEl('option', {
                text: font.name,
                value: font.family
            });
            option.style.fontFamily = font.family;
        });
        fontSelect.value = this.selectedFont;
        fontSelect.addEventListener('change', () => {
            this.selectedFont = fontSelect.value;
        });

        // 字体大小设置
        const fontSizeSection = container.createDiv('settings-section');
        fontSizeSection.createSpan({ text: '大小:', cls: 'settings-label' });
        const fontSizeSelect = fontSizeSection.createEl('select', { cls: 'settings-select' });
        const sizes = [
            { name: '小号', size: '12px' },
            { name: '正常', size: '16px' },
            { name: '大号', size: '20px' },
            { name: '超大', size: '24px' }
        ];
        sizes.forEach(size => {
            fontSizeSelect.createEl('option', {
                text: size.name,
                value: size.size
            });
        });
        fontSizeSelect.value = this.selectedFontSize;
        fontSizeSelect.addEventListener('change', () => {
            this.selectedFontSize = fontSizeSelect.value;
        });

        // 颜色设置
        const colorSection = container.createDiv('settings-section');
        colorSection.createSpan({ text: '颜色:', cls: 'settings-label' });
        const colorPreview = colorSection.createDiv('color-preview');
        colorPreview.style.backgroundColor = this.selectedColor;

        const colorPicker = new Pickr({
            el: colorPreview,
            theme: 'classic',
            default: this.selectedColor,
            swatches: [
                '#000000', '#FF0000', '#00FF00', '#0000FF',
                '#FFFF00', '#FF00FF', '#00FFFF', '#808080'
            ],
            components: {
                preview: true,
                opacity: true,
                hue: true,
                interaction: {
                    hex: true,
                    rgba: true,
                    input: true,
                    save: true
                }
            }
        });

        colorPicker.on('save', (color: Pickr.HSVaColor) => {
            if (!color) return;
            this.selectedColor = color.toHEXA().toString();
            colorPreview.style.backgroundColor = this.selectedColor;
            colorPicker.hide();
        });

        // 高亮颜色设置
        const highlightSection = container.createDiv('settings-section');
        highlightSection.createSpan({ text: '高亮:', cls: 'settings-label' });
        const highlightPreview = highlightSection.createDiv('color-preview');
        highlightPreview.style.backgroundColor = this.selectedHighlightColor;

        const highlightPicker = new Pickr({
            el: highlightPreview,
            theme: 'classic',
            default: this.selectedHighlightColor,
            swatches: [
                '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
                '#f44336', '#e91e63', '#9c27b0', '#673ab7'
            ],
            components: {
                preview: true,
                opacity: true,
                hue: true,
                interaction: {
                    hex: true,
                    rgba: true,
                    input: true,
                    save: true
                }
            }
        });

        highlightPicker.on('save', (color: Pickr.HSVaColor) => {
            if (!color) return;
            this.selectedHighlightColor = color.toHEXA().toString();
            highlightPreview.style.backgroundColor = this.selectedHighlightColor;
            highlightPicker.hide();
        });

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
    
            editorState.editor.replaceSelection(
                `<span style="font-family: ${this.selectedFont}; font-size: ${this.selectedFontSize}">${selection}</span>`
            );
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
    
            editorState.editor.replaceSelection(
                `<span style="color: ${this.selectedColor}">${selection}</span>`
            );
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
    
            editorState.editor.replaceSelection(
                `<span style="background-color: ${this.selectedHighlightColor}">${selection}</span>`
            );
        };
    };

    private createTableButton(container: HTMLElement) {
        const button = container.createEl('button', {
            cls: 'format-toolbar-button',
            text: '表格'
        });

        button.onclick = async () => {
            const editorState = this.checkEditorState();
            if (!editorState) return;

            const selection = editorState.editor.getSelection();
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
                    