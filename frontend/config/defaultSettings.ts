import type { Settings as LayoutSettings } from '@ant-design/pro-components';

const defaultSettings: LayoutSettings & { siderWidth?: number } = {
  navTheme: 'light',
  colorPrimary: '#1677ff',
  layout: 'side',
  contentWidth: 'Fluid',
  fixedHeader: true,
  fixSiderbar: true,
  siderWidth: 224,
  splitMenus: false,
  title: 'GD旅游社管理系统',
};

export default defaultSettings;
