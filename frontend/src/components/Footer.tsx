export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="gd-footer">
      <span>GD旅游社管理系统 · 让旅行管理更简单</span>
      <span className="gd-footer__meta">© {year} GD Travel · Powered by Umi 4 & Ant Design Pro</span>
    </footer>
  );
}
