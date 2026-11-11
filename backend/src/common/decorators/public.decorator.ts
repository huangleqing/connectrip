import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** 标记无需 JWT 鉴权的接口 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
