import { IsString, IsOptional, IsEnum, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { HardwareCategory, HardwareStatus } from '@prisma/client';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  tag: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsEnum(HardwareCategory)
  @IsNotEmpty()
  category: HardwareCategory;

  @IsEnum(HardwareStatus)
  @IsOptional()
  status?: HardwareStatus;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  make: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  model: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  serialNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(17)
  macAddress?: string;

  @IsString()
  @IsOptional()
  @MaxLength(45)
  ipAddress?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  network?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  computerName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  operatingSystem?: string;

  @IsString()
  @IsOptional()
  locationId?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;
}
