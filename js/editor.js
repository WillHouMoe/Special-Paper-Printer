import { state } from './state.js';
import { getPixels } from './utils.js';

// --- 初始化与背景 ---

export function initEditor() {
    const welcomeScreen = document.getElementById('welcome-screen');
    const app = document.getElementById('app');
    const loadingOverlay = document.getElementById('loading-overlay');

    loadingOverlay.classList.add('hidden');
    welcomeScreen.classList.add('hidden');
    app.classList.remove('hidden');

    const wVal = parseFloat(document.getElementById('paper-width').value);
    const hVal = parseFloat(document.getElementById('paper-height').value);
    const wUnit = document.getElementById('width-unit').value;
    const hUnit = document.getElementById('height-unit').value;

    const pxWidth = getPixels(wVal, wUnit);
    const pxHeight = getPixels(hVal, hUnit);

    if (state.fabricCanvas) state.fabricCanvas.dispose();

    state.fabricCanvas = new fabric.Canvas('c', {
        width: pxWidth,
        height: pxHeight,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true
    });

    setBackground(state.uploadedImageURL);
    setupFabricEvents();

    document.getElementById('canvas-info').innerText = `${wVal} x ${hVal} ${wUnit}`;

    // 延时重置缩放以确保 DOM 渲染完成
    setTimeout(() => resetZoom(), 100);
}

export function setBackground(url) {
    if (!url || !state.fabricCanvas) return;
    fabric.Image.fromURL(url, (img) => {
        state.fabricCanvas.setBackgroundImage(img, state.fabricCanvas.renderAll.bind(state.fabricCanvas), {
            originX: 'left',
            originY: 'top',
            left: 0,
            top: 0,
            scaleX: state.fabricCanvas.width / img.width,
            scaleY: state.fabricCanvas.height / img.height
        });
        saveHistory();
    }, { crossOrigin: 'anonymous' });
}

// --- 对象操作 ---

export function addText() {
    if (!state.fabricCanvas) return;
    const text = new fabric.IText('点击编辑文本', {
        left: state.fabricCanvas.width / 2 - 100,
        top: state.fabricCanvas.height / 2,
        fontFamily: 'Arial',
        fontSize: 40,
        fill: '#000000'
    });
    state.fabricCanvas.add(text);
    state.fabricCanvas.setActiveObject(text);
    saveHistory();
}

export function addImage(file) {
    if (!file || !state.fabricCanvas) return;
    const reader = new FileReader();
    reader.onload = (f) => {
        fabric.Image.fromURL(f.target.result, (img) => {
            if (img.width > state.fabricCanvas.width / 2) {
                img.scaleToWidth(state.fabricCanvas.width / 2);
            }
            img.set({
                left: state.fabricCanvas.width / 2 - (img.getScaledWidth() / 2),
                top: state.fabricCanvas.height / 2 - (img.getScaledHeight() / 2)
            });
            state.fabricCanvas.add(img);
            state.fabricCanvas.setActiveObject(img);
            saveHistory();
        });
    };
    reader.readAsDataURL(file);
}

export function deleteActiveObject() {
    if (!state.fabricCanvas) return;
    const activeObjects = state.fabricCanvas.getActiveObjects();
    if (activeObjects.length) {
        state.fabricCanvas.discardActiveObject();
        activeObjects.forEach((obj) => state.fabricCanvas.remove(obj));
        saveHistory();
    }
}

export function bringFront() {
    const obj = state.fabricCanvas?.getActiveObject();
    if (obj) { obj.bringForward(); saveHistory(); }
}

export function sendBack() {
    const obj = state.fabricCanvas?.getActiveObject();
    if (obj) { obj.sendBackwards(); saveHistory(); }
}

export function clearCanvas() {
    if (state.fabricCanvas && confirm("确定清空所有内容？(背景将保留)")) {
        state.fabricCanvas.clear();
        setBackground(state.uploadedImageURL);
    }
}

// --- 属性控制 ---

export function updatePropertyPanel() {
    const propPanel = document.getElementById('object-properties');
    const textControls = document.getElementById('text-controls');
    const propColor = document.getElementById('prop-color');
    const propSize = document.getElementById('prop-fontsize');
    const propFont = document.getElementById('prop-fontfamily');

    const obj = state.fabricCanvas?.getActiveObject();
    if (!obj) {
        propPanel.classList.add('hidden');
        return;
    }
    propPanel.classList.remove('hidden');

    if (obj.type === 'i-text' || obj.type === 'text') {
        textControls.classList.remove('hidden');
        propColor.value = obj.fill;
        document.getElementById('color-val-text').innerText = obj.fill;
        propSize.value = obj.fontSize;
        propFont.value = obj.fontFamily;
    } else {
        textControls.classList.add('hidden');
    }
}

export function setStyle(key, value) {
    const obj = state.fabricCanvas?.getActiveObject();
    if (obj && (obj.type === 'i-text' || obj.type === 'text')) {
        obj.set(key, value);
        state.fabricCanvas.renderAll();
        saveHistory();
    }
}

export function toggleBold() {
    const obj = state.fabricCanvas?.getActiveObject();
    if(obj) setStyle('fontWeight', obj.fontWeight === 'bold' ? 'normal' : 'bold');
}
export function toggleItalic() {
    const obj = state.fabricCanvas?.getActiveObject();
    if(obj) setStyle('fontStyle', obj.fontStyle === 'italic' ? 'normal' : 'italic');
}
export function toggleUnderline() {
    const obj = state.fabricCanvas?.getActiveObject();
    if(obj) setStyle('underline', !obj.underline);
}


// --- 历史记录 ---

function setupFabricEvents() {
    state.fabricCanvas.on('selection:created', updatePropertyPanel);
    state.fabricCanvas.on('selection:updated', updatePropertyPanel);
    state.fabricCanvas.on('selection:cleared', updatePropertyPanel);
    state.fabricCanvas.on('object:modified', saveHistory);
    state.fabricCanvas.on('object:added', saveHistory);
}

function saveHistory() {
    if (state.historyProcessing) return;
    if (state.historyIndex < state.history.length - 1) {
        state.history = state.history.slice(0, state.historyIndex + 1);
    }
    state.history.push(JSON.stringify(state.fabricCanvas));
    if (state.history.length > 20) state.history.shift();
    state.historyIndex = state.history.length - 1;
    updateHistoryButtons();
}

export function undo() {
    if (state.historyIndex > 0) {
        state.historyIndex--;
        loadHistory(state.history[state.historyIndex]);
    }
}

export function redo() {
    if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        loadHistory(state.history[state.historyIndex]);
    }
}

function loadHistory(json) {
    state.historyProcessing = true;
    state.fabricCanvas.loadFromJSON(json, () => {
        state.fabricCanvas.renderAll();
        state.historyProcessing = false;
        updatePropertyPanel();
        updateHistoryButtons();
    });
}

function updateHistoryButtons() {
    document.getElementById('undo-btn').disabled = state.historyIndex <= 0;
    document.getElementById('redo-btn').disabled = state.historyIndex >= state.history.length - 1;
}

// --- 缩放逻辑 ---

export function setZoom(delta) {
    const wrapperDiv = document.getElementById('canvas-wrapper-div');
    const wrapper = document.querySelector('.canvas-container');
    if (!wrapper || !state.fabricCanvas) return;

    let currentScale = parseFloat(wrapper.getAttribute('data-scale')) || 1;

    if (delta === 0) {
        const padding = 80;
        const scaleW = (wrapperDiv.clientWidth - padding) / state.fabricCanvas.width;
        const scaleH = (wrapperDiv.clientHeight - padding) / state.fabricCanvas.height;
        currentScale = Math.min(scaleW, scaleH, 1);
        if (currentScale < 0.1) currentScale = 0.1;
    } else {
        currentScale += delta;
    }

    currentScale = Math.max(0.1, Math.min(5.0, currentScale));

    wrapper.style.transform = `scale(${currentScale})`;
    wrapper.setAttribute('data-scale', currentScale);
    document.getElementById('zoom-val').innerText = Math.round(currentScale * 100) + '%';

    const newWidth = state.fabricCanvas.width * currentScale;
    const newHeight = state.fabricCanvas.height * currentScale;

    wrapper.style.width = `${newWidth}px`;
    wrapper.style.height = `${newHeight}px`;

    const parentW = wrapperDiv.clientWidth;
    const parentH = wrapperDiv.clientHeight;

    let marginLeft = 0;
    let marginTop = 0;

    if (newWidth < parentW) {
        marginLeft = (parentW - newWidth) / 2;
    }
    if (newHeight < parentH) {
        marginTop = (parentH - newHeight) / 2;
    }

    wrapper.style.marginLeft = `${marginLeft}px`;
    wrapper.style.marginTop = `${marginTop}px`;
}

export function resetZoom() { setZoom(0); }

// --- 导出与打印 ---

export function printCanvas() {
    if (!state.fabricCanvas) return;
    const wVal = document.getElementById('paper-width').value;
    const hVal = document.getElementById('paper-height').value;
    const wUnit = document.getElementById('width-unit').value;
    const hUnit = document.getElementById('height-unit').value;

    const originalBg = state.fabricCanvas.backgroundImage;
    state.fabricCanvas.setBackgroundImage(null, state.fabricCanvas.renderAll.bind(state.fabricCanvas));

    // 使用 SVG 矢量打印
    const svgContent = state.fabricCanvas.toSVG({
        suppressPreamble: true,
        viewBox: { x: 0, y: 0, width: state.fabricCanvas.width, height: state.fabricCanvas.height }
    });

    state.fabricCanvas.setBackgroundImage(originalBg, state.fabricCanvas.renderAll.bind(state.fabricCanvas));

    const win = window.open('', '_blank');
    win.document.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>打印预览</title>
                <style>
                    @page { size: ${wVal}${wUnit} ${hVal}${hUnit}; margin: 0; }
                    body {
                        margin: 0; padding: 0;
                        width: ${wVal}${wUnit}; height: ${hVal}${hUnit};
                        display: flex; align-items: center; justify-content: center;
                        overflow: hidden;
                    }
                    svg { width: 100%; height: 100%; display: block; }
                </style>
            </head>
            <body>
                ${svgContent}
                <script>
                    window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 200); };
                <\/script>
            </body>
        </html>
    `);
    win.document.close();
}

export function downloadImage() {
    if (!state.fabricCanvas) return;
    const link = document.createElement('a');
    link.download = 'my-note.png';
    link.href = state.fabricCanvas.toDataURL({ format: 'png', multiplier: 2 });
    link.click();
}

export function exportJSON() {
    if (!state.fabricCanvas) return;
    const json = JSON.stringify(state.fabricCanvas.toJSON());
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement('a');
    link.download = "note-project.json";
    link.href = URL.createObjectURL(blob);
    link.click();
}
