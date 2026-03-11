import { IsInt, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';

export class UpdateCompanyInputDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  numberOfUsers?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  numberOfProducts?: number;
}
