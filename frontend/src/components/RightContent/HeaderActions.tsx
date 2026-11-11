import { QuestionCircleOutlined } from '@ant-design/icons';
import { Button, Popover, Typography } from 'antd';

export default function HeaderActions() {
  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      title="权限说明"
      content={
        <div className="gd-help-popover">
          <Typography.Paragraph>系统采用 RBAC 权限模型，账号通过角色获得菜单与按钮权限。</Typography.Paragraph>
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            如遇菜单不可见或按钮缺失，请联系超级管理员在「角色管理」中调整权限。
          </Typography.Paragraph>
        </div>
      }
    >
      <Button type="text" icon={<QuestionCircleOutlined />} aria-label="帮助" />
    </Popover>
  );
}
