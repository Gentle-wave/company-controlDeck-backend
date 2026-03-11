import { IsUUID } from 'class-validator';

export class UploadImageDto {
  @IsUUID()
  ownerId!: string;
}
