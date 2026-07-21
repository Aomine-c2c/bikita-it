import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { RepairStatus } from '../../enums';

export class CreateRepairDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  hardwareId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  description: string;

  @IsEnum(RepairStatus)
  @IsOptional()
  status?: RepairStatus;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  condition?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  remarks?: string;

  @IsDateString()
  @IsOptional()
  estimatedCompletion?: string;

  @IsString()
  @IsOptional()
  technicianId?: string;
}
