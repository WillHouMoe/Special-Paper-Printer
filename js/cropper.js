import { state } from './state.js';
import { setBackground, initEditor } from './editor.js';

export function openCropper(url, ratio) {
    const cropModal = document.getElementById('crop-modal');
    const cropImgEl = document.getElementById('crop-image');
    const cropScaleWrapper = document.getElementById('crop-scale-wrapper');
    const cropScrollContainer = document.getElementById('crop-scroll-container');

    cropImgEl.src = url;
    cropModal.classList.remove('hidden');

    // 重置状态
    state.currentCropScale = 1;
    cropScaleWrapper.style.transform = `scale(1)`;
    cropScaleWrapper.style.width = 'auto';
    cropScaleWrapper.style.height = 'auto';
    cropScaleWrapper.style.margin = '0';

    if (state.cropper) state.cropper.destroy();

    state.cropper = new Cropper(cropImgEl, {
        viewMode: 1,
        aspectRatio: ratio,
        autoCropArea: 0.9,
        dragMode: 'move',
        guides: true,
        center: true,
        background: false,
        toggleDragModeOnDblclick: false,
        zoomable: false,
        zoomOnTouch: false,
        zoomOnWheel: false,

        ready: function () {
            // 计算适应屏幕的最小比例
            const containerData = state.cropper.getContainerData();
            const viewportW = cropScrollContainer.clientWidth - 40;
            const viewportH = cropScrollContainer.clientHeight - 40;

            const scaleW = viewportW / containerData.width;
            const scaleH = viewportH / containerData.height;

            let fitScale = Math.min(scaleW, scaleH);
            state.minCropScale = fitScale;
            state.currentCropScale = fitScale;

            updateCropZoom(0);
        }
    });
}

export function updateCropZoom(delta) {
    if (!state.cropper) return;

    if (delta !== 0) {
        state.currentCropScale += delta;
    }

    state.currentCropScale = Math.max(state.minCropScale, Math.min(5.0, state.currentCropScale));

    const cropScaleWrapper = document.getElementById('crop-scale-wrapper');
    const cropScrollContainer = document.getElementById('crop-scroll-container');

    const cropperData = state.cropper.getContainerData();
    const baseWidth = cropperData.width;
    const baseHeight = cropperData.height;

    cropScaleWrapper.style.transform = `scale(${state.currentCropScale})`;

    const newWidth = baseWidth * state.currentCropScale;
    const newHeight = baseHeight * state.currentCropScale;

    cropScaleWrapper.style.width = `${newWidth}px`;
    cropScaleWrapper.style.height = `${newHeight}px`;

    const containerW = cropScrollContainer.clientWidth;
    const containerH = cropScrollContainer.clientHeight;

    let marginLeft = 0;
    let marginTop = 0;

    if (newWidth < containerW) {
        marginLeft = (containerW - newWidth) / 2;
    }
    if (newHeight < containerH) {
        marginTop = (containerH - newHeight) / 2;
    }

    cropScaleWrapper.style.marginLeft = `${marginLeft}px`;
    cropScaleWrapper.style.marginTop = `${marginTop}px`;
}

export function confirmCrop() {
    if (!state.cropper) return;
    const canvas = state.cropper.getCroppedCanvas({
        maxWidth: 4096,
        maxHeight: 4096,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });

    state.uploadedImageURL = canvas.toDataURL('image/jpeg', 0.9);

    document.getElementById('crop-modal').classList.add('hidden');
    document.getElementById('start-editing').disabled = false;
    document.getElementById('file-status').textContent = "图片已就绪";

    // 如果已经在编辑器页面，直接设置背景；否则等待用户点击“开始编辑”
    if (!document.getElementById('welcome-screen').classList.contains('hidden')) {
        // do nothing, wait for user
    } else {
        setBackground(state.uploadedImageURL);
    }
}

export function cancelCrop() {
    document.getElementById('crop-modal').classList.add('hidden');
    if (state.cropper) state.cropper.destroy();
    document.getElementById('template-upload').value = '';
    document.getElementById('file-status').textContent = "操作已取消";
    state.currentCropScale = 1;
}

export function rotate(deg) {
    if (state.cropper) state.cropper.rotate(deg);
}
