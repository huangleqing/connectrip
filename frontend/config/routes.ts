export default [
  {
    path: '/login',
    layout: false,
    hideInMenu: true,
    component: './Login',
  },
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/dashboard',
    name: '工作台',
    icon: 'dashboard',
    component: './Dashboard',
  },
  {
    path: '/operation-center',
    name: '操作中心',
    icon: 'global',
    access: 'operation:view',
    component: './OperationCenter',
  },
  {
    path: '/system',
    name: '系统管理',
    icon: 'setting',
    access: 'canAccessSystem',
    routes: [
      {
        path: '/system/users',
        name: '用户管理',
        icon: 'user',
        access: 'system:user:view',
        component: './System/Users',
      },
      {
        path: '/system/roles',
        name: '角色管理',
        icon: 'team',
        access: 'system:role:view',
        component: './System/Roles',
      },
    ],
  },
  {
    path: '/403',
    hideInMenu: true,
    component: './Exception/403',
  },
  {
    path: '*',
    layout: false,
    component: './Exception/404',
  },
];
