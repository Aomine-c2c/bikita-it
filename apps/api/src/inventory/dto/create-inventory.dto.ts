import { IsString, IsOptional, IsInt, Min, MaxLength } from 'class-validator';

export class CreateInventoryDto {
  @IsString()
  @MaxLength(100)
  sku: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @MaxLength(100)
  category: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  type?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @IsInt()
  @Min(0)
  minStock: number;

  @IsInt()
  @Min(0)
  maxStock: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  binLocation?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  remarks?: string;
}
