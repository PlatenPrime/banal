import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** HTTP body for POST /api/v1/examples — mirrors createExampleRequestSchema. */
export class CreateExampleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
