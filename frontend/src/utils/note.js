/**
 * 检查文件路径是否属于灵感或任务（即非普通笔记）
 */
export const isSparkOrTask = (filepath) => Boolean(filepath && /(sparks|tasks)[/\\]/.test(filepath));

