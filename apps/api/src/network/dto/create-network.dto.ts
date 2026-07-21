import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

export class CreateNetworkDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  hostname: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(17)
  macAddress: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(45)
  ipAddress: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  os?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  deviceType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  connectionStatus?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  accessPoint?: string;

  @IsString()
  @IsOptional()
  employeeId?: string;
}
