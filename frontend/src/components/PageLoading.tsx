import { Spin } from 'antd';

export default function PageLoading() {
  return (
    <div className="gd-page-loading">
      <div className="gd-page-loading__logo">
        <img src="/logo.svg" alt="GD旅游社" width={48} height={48} />
      </div>
      <Spin size="large" />
      <div className="gd-page-loading__text">正在加载 GD旅游社管理系统...</div>
    </div>
  );
}
