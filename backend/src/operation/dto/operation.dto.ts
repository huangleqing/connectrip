import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export const TOUR_STAGES = [
  'today_depart',
  'tomorrow_depart',
  'today_return',
  'tomorrow_return',
] as const;

export class CreateOperationLineDto {
  @Transform(trimString)
  @IsString({ message: '线路名称必须为字符串' })
  @IsNotEmpty({ message: '请输入线路名称' })
  @MaxLength(64, { message: '线路名称最多 64 个字符' })
  name: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString({ message: '线路编码必须为字符串' })
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,63}$/, {
    message: '线路编码需为 2-64 位字母、数字、下划线或连字符',
  })
  code: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '排序必须为整数' })
  @Min(0, { message: '排序必须大于等于 0' })
  sort?: number;

  @IsOptional()
  @IsBoolean({ message: '启用状态必须为布尔值' })
  enabled?: boolean;
}

export class UpdateOperationLineDto {
  @IsOptional()
  @Transform(trimString)
  @IsString({ message: '线路名称必须为字符串' })
  @IsNotEmpty({ message: '线路名称不能为空' })
  @MaxLength(64, { message: '线路名称最多 64 个字符' })
  name?: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString({ message: '线路编码必须为字符串' })
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_-]{1,63}$/, {
    message: '线路编码需为 2-64 位字母、数字、下划线或连字符',
  })
  code?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '排序必须为整数' })
  @Min(0, { message: '排序必须大于等于 0' })
  sort?: number;

  @IsOptional()
  @IsBoolean({ message: '启用状态必须为布尔值' })
  enabled?: boolean;
}

export class CreateTourDto {
  @Type(() => Number)
  @IsInt({ message: '线路必须为整数' })
  lineId: number;

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: '订单编号必须为字符串' })
  @MaxLength(64, { message: '订单编号最多 64 个字符' })
  orderNo?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString({ message: '团号必须为字符串' })
  @MaxLength(64, { message: '团号最多 64 个字符' })
  tourNo?: string;

  @Transform(trimString)
  @IsString({ message: '团队名称必须为字符串' })
  @IsNotEmpty({ message: '请输入团队名称' })
  @MaxLength(120, { message: '团队名称最多 120 个字符' })
  name: string;

  @IsIn(TOUR_STAGES, { message: '团队状态不合法' })
  stage: (typeof TOUR_STAGES)[number];

  @Transform(trimString)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '出团日期格式应为 YYYY-MM-DD' })
  departureDate: string;

  @Transform(trimString)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '返程日期格式应为 YYYY-MM-DD' })
  returnDate: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(255)
  flightsOutbound?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(255)
  flightsInbound?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(64)
  source?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(120)
  agency?: string;

  @Type(() => Number)
  @IsInt({ message: '总人数必须为整数' })
  @Min(0)
  peopleTotal: number;

  @Type(() => Number)
  @IsInt({ message: '成人数必须为整数' })
  @Min(0)
  peopleAdults: number;

  @Type(() => Number)
  @IsInt({ message: '儿童数必须为整数' })
  @Min(0)
  peopleChildren: number;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(64)
  owner?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(64)
  assistant?: string;

  @IsOptional()
  @IsArray({ message: '行程必须为数组' })
  itinerary?: unknown[];

  @IsOptional()
  @IsObject({ message: '操作进度必须为对象' })
  operations?: Record<string, unknown>;

  @IsOptional()
  @IsObject({ message: '转包地接信息必须为对象' })
  subcontract?: Record<string, unknown>;

  @IsOptional()
  @IsArray({ message: '酒店安排必须为数组' })
  hotels?: unknown[];

  @IsOptional()
  @IsArray({ message: '餐厅安排必须为数组' })
  restaurants?: unknown[];

  @IsOptional()
  @IsArray({ message: '车队安排必须为数组' })
  fleet?: unknown[];

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(500)
  ticket?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(500)
  visa?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(500)
  scenic?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(500)
  performance?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(500)
  transport?: string;
}

export class UpdateTourDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '线路必须为整数' })
  lineId?: number;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsIn(TOUR_STAGES, { message: '团队状态不合法' })
  stage?: (typeof TOUR_STAGES)[number];

  @IsOptional()
  @Transform(trimString)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '出团日期格式应为 YYYY-MM-DD' })
  departureDate?: string;

  @IsOptional()
  @Transform(trimString)
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '返程日期格式应为 YYYY-MM-DD' })
  returnDate?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(255)
  flightsOutbound?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(255)
  flightsInbound?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(64)
  source?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(120)
  agency?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  peopleTotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  peopleAdults?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  peopleChildren?: number;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(64)
  owner?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(64)
  assistant?: string;

  @IsOptional()
  @IsArray({ message: '行程必须为数组' })
  itinerary?: unknown[];

  @IsOptional()
  @IsObject({ message: '操作进度必须为对象' })
  operations?: Record<string, unknown>;

  @IsOptional()
  @IsObject({ message: '转包地接信息必须为对象' })
  subcontract?: Record<string, unknown>;

  @IsOptional()
  @IsArray({ message: '酒店安排必须为数组' })
  hotels?: unknown[];

  @IsOptional()
  @IsArray({ message: '餐厅安排必须为数组' })
  restaurants?: unknown[];

  @IsOptional()
  @IsArray({ message: '车队安排必须为数组' })
  fleet?: unknown[];

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(500)
  ticket?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(500)
  visa?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(500)
  scenic?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(500)
  performance?: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(500)
  transport?: string;
}
