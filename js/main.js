import { state } from './state.js';
import * as Editor from './editor.js';
import * as CropperLogic from './cropper.js';

// --- 事件监听器绑定 ---

function bindEvents() {
    // 1. 欢迎屏幕 & 上传
    const templateInput = document.getElementById('template-upload');
    templateInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('file-status').textContent = file.name;
            const reader = new FileReader();
            reader.onload = (evt) => {
                const w = parseFloat(document.getElementById('paper-width').value);
                const h = parseFloat(document.getElementById('paper-height').value);
                CropperLogic.openCropper(evt.target.result, w / h);
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('start-editing').addEventListener('click', Editor.initEditor);

    document.getElementById('use-template').addEventListener('click', () => {
        state.uploadedImageURL = "https://images.unsplash.com/photo-1596496637380-60b6e492213e?q=80&w=1000&auto=format&fit=crop";
        document.getElementById('start-editing').disabled = false;
        Editor.initEditor();
    });

    // 2. 裁剪模态框
    document.getElementById('confirm-crop').addEventListener('click', CropperLogic.confirmCrop);
    document.getElementById('cancel-crop').addEventListener('click', CropperLogic.cancelCrop);
    document.getElementById('crop-zoom-in').addEventListener('click', () => CropperLogic.updateCropZoom(0.1));
    document.getElementById('crop-zoom-out').addEventListener('click', () => CropperLogic.updateCropZoom(-0.1));
    document.getElementById('crop-rotate-left').addEventListener('click', () => CropperLogic.rotate(-90));
    document.getElementById('crop-rotate-right').addEventListener('click', () => CropperLogic.rotate(90));

    // 3. 编辑器顶部工具栏
    document.getElementById('btn-clear').addEventListener('click', Editor.clearCanvas);
    document.getElementById('btn-save').addEventListener('click', Editor.exportJSON);
    document.getElementById('btn-export').addEventListener('click', Editor.downloadImage);
    document.getElementById('btn-print').addEventListener('click', Editor.printCanvas);

    // 4. 编辑器左侧添加内容
    document.getElementById('add-text-btn').addEventListener('click', Editor.addText);
    document.getElementById('add-image-input').addEventListener('change', (e) => Editor.addImage(e.target.files[0]));

    // 5. 编辑器属性面板
    document.getElementById('prop-color').addEventListener('input', (e) => {
        Editor.setStyle('fill', e.target.value);
        document.getElementById('color-val-text').innerText = e.target.value;
    });
    document.getElementById('prop-fontsize').addEventListener('input', (e) => Editor.setStyle('fontSize', parseInt(e.target.value)));
    document.getElementById('prop-fontfamily').addEventListener('change', (e) => Editor.setStyle('fontFamily', e.target.value));

    document.getElementById('prop-bold').addEventListener('click', Editor.toggleBold);
    document.getElementById('prop-italic').addEventListener('click', Editor.toggleItalic);
    document.getElementById('prop-underline').addEventListener('click', Editor.toggleUnderline);

    document.getElementById('action-bring-front').addEventListener('click', Editor.bringFront);
    document.getElementById('action-send-back').addEventListener('click', Editor.sendBack);
    document.getElementById('action-delete').addEventListener('click', Editor.deleteActiveObject);

    // 6. 撤销/重做
    document.getElementById('undo-btn').addEventListener('click', Editor.undo);
    document.getElementById('redo-btn').addEventListener('click', Editor.redo);

    // 7. 缩放控制栏
    document.getElementById('zoom-in').addEventListener('click', () => Editor.setZoom(0.1));
    document.getElementById('zoom-out').addEventListener('click', () => Editor.setZoom(-0.1));
    document.getElementById('zoom-reset').addEventListener('click', Editor.resetZoom);

    // 8. 全局快捷键
    setupShortcuts();

    // 9. 窗口大小改变
    window.addEventListener('resize', () => {
        if (state.fabricCanvas) Editor.setZoom(0); // 维持居中
        if (!document.getElementById('crop-modal').classList.contains('hidden')) {
            CropperLogic.updateCropZoom(0);
        }
    });
}

function setupShortcuts() {
    // 键盘
    window.addEventListener('keydown', (e) => {
        // Ctrl + P
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            Editor.printCanvas();
        }
        // Delete
        if (e.key === 'Delete' || e.key === 'Backspace') {
            // 简单判断：如果不在输入框中，则删除选中的Fabric对象
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                Editor.deleteActiveObject();
            }
        }
    });

    // 滚轮缩放 (Ctrl + Wheel)
    window.addEventListener('wheel', (e) => {
        if (!(e.ctrlKey || e.metaKey)) return;
        e.preventDefault();

        const delta = e.deltaY > 0 ? -0.1 : 0.1;

        if (!document.getElementById('crop-modal').classList.contains('hidden') && state.cropper) {
            CropperLogic.updateCropZoom(delta);
        } else if (!document.getElementById('app').classList.contains('hidden')) {
            Editor.setZoom(delta);
        }
    }, { passive: false });
}

// 启动
window.onload = () => {
    document.getElementById('loading-overlay').classList.add('hidden');
    bindEvents();
};
