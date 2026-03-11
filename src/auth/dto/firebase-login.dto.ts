import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class FirebaseLoginDto {
  @IsString()
  @MinLength(10)
  idToken!: string;

  // Used only for first-time provisioning when the email doesn't exist yet.
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

