import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** HTTP body for POST examples (versioned under apiV1Path) — mirrors createExampleRequestSchema. */
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
