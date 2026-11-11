import { history } from '@umijs/max';
import { Button, Result } from 'antd';

export default function AccessDenied() {
  return (
    <div className="gd-exception-page">
      <Result
        status="403"
        title="403"
        subTitle="抱歉，当前账号没有访问该页面的权限。如需开通，请联系超级管理员调整角色权限。"
        extra={
          <Button type="primary" onClick={() => history.replace('/dashboard')}>
            返回工作台
          </Button>
        }
      />
    </div>
  );
}
