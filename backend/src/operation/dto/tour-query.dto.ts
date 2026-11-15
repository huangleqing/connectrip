import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { TOUR_STAGES } from './operation.dto';

export class TourQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '线路 ID 必须为整数' })
  lineId?: number;

  @IsOptional()
  @IsIn(TOUR_STAGES, { message: '团队状态不合法' })
  stage?: (typeof TOUR_STAGES)[number];

  @IsOptional()
  @IsString({ message: '搜索关键字必须为字符串' })
  @MaxLength(100, { message: '搜索关键字最多 100 个字符' })
  keyword?: string;
}
