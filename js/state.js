export const state = {
    fabricCanvas: null,     // Fabric 画布实例
    cropper: null,          // Cropper 实例
    uploadedImageURL: null, // 用户上传图片的 DataURL

    // 历史记录
    history: [],
    historyProcessing: false,
    historyIndex: -1,

    // 裁剪视图缩放
    currentCropScale: 1,
    minCropScale: 0.1
};
