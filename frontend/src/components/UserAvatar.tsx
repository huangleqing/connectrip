import { UserOutlined } from '@ant-design/icons';
import { Avatar } from 'antd';

const COLORS = ['#1677ff', '#0e7490', '#7c3aed', '#c2410c', '#15803d', '#be123c'];

function pickColor(name?: string) {
  if (!name) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % COLORS.length;
  }
  return COLORS[hash];
}

interface UserAvatarProps {
  name?: string;
  src?: string;
  size?: number;
}

export default function UserAvatar({ name, src, size = 36 }: UserAvatarProps) {
  if (src) {
    return <Avatar size={size} src={src} alt={name} />;
  }

  return (
    <Avatar
      size={size}
      icon={<UserOutlined />}
      style={{
        backgroundColor: pickColor(name),
        flexShrink: 0,
        fontWeight: 600,
      }}
    >
      {name?.trim().slice(0, 1)}
    </Avatar>
  );
}
