import { IsInt, IsPositive, IsString, MaxLength, Min } from 'class-validator';

export class CreateCompanyInputDto {
  @IsString()
  @MaxLength(255)
  companyName!: string;

  @IsInt()
  @IsPositive()
  numberOfUsers!: number;

  @IsInt()
  @Min(0)
  numberOfProducts!: number;
}
