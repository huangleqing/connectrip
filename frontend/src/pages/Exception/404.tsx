import { history } from '@umijs/max';
import { Button, Result } from 'antd';
import { getToken } from '@/utils/auth';

export default function NotFoundPage() {
  const loggedIn = Boolean(getToken());

  return (
    <div className="gd-exception-fullscreen">
      <Result
        status="404"
        title="404"
        subTitle="抱歉，你访问的页面不存在，或者已经被移动。"
        extra={
          <Button type="primary" onClick={() => history.replace(loggedIn ? '/dashboard' : '/login')}>
            {loggedIn ? '返回工作台' : '前往登录'}
          </Button>
        }
      />
    </div>
  );
}
