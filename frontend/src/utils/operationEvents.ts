export type OperationDataChangeSource = 'console' | 'lines' | 'editor';

export interface OperationDataChange {
  source: OperationDataChangeSource;
}

type OperationDataChangeListener = (change: OperationDataChange) => void;

const listeners = new Set<OperationDataChangeListener>();

/**
 * 操作中心内的线路或团队发生变化时通知其他已打开的页签。
 * 页签使用 keep-alive 常驻，不能依赖重新挂载来刷新数据。
 */
export function notifyOperationDataChanged(change: OperationDataChange) {
  listeners.forEach((listener) => {
    listener(change);
  });
}

export function subscribeOperationDataChanged(listener: OperationDataChangeListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
