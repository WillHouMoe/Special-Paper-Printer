/**
 * 将物理单位转换为像素值
 * @param {number} value 数值
 * @param {string} unit 单位 (in, mm, cm)
 * @returns {number} 像素值
 */
export function getPixels(value, unit) {
    const k = 96; // 96 DPI
    if (unit === 'in') return value * k;
    if (unit === 'mm') return (value * k) / 25.4;
    if (unit === 'cm') return (value * k) / 2.54;
    return value;
}
