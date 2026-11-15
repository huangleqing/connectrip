import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class OperationLineQueryDto {
  @IsOptional()
  @Transform(
    ({ value }) =>
      value === true || value === 'true' || value === 1 || value === '1',
  )
  @IsBoolean({ message: 'includeDisabled 必须为布尔值' })
  includeDisabled?: boolean;
}
