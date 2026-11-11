import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class RoleUserOptionsQueryDto {
  @IsOptional()
  @IsString({ message: '搜索关键字必须为字符串' })
  @MaxLength(50, { message: '搜索关键字不能超过 50 个字符' })
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit 必须为整数' })
  @Min(1, { message: 'limit 最小为 1' })
  @Max(200, { message: 'limit 最大为 200' })
  limit: number = 200;
}
