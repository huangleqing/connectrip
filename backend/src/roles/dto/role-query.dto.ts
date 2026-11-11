import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class RoleQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: '搜索关键字不能超过 50 个字符' })
  keyword?: string;
}
