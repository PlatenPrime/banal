import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** OpenAPI mirror of `exampleDtoSchema` from `@app/shared-contracts`. */
export class ExampleResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id!: string;

  @ApiProperty({ example: 'Alpha', minLength: 1, maxLength: 200 })
  name!: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'Optional description',
    maxLength: 2000,
  })
  description?: string | null;

  @ApiProperty({
    format: 'date-time',
    example: '2026-07-21T10:00:00.000Z',
  })
  createdAt!: string;
}

/** OpenAPI mirror of `exampleListResponseSchema`. */
export class ExampleListResponseDto {
  @ApiProperty({ type: [ExampleResponseDto] })
  items!: ExampleResponseDto[];

  @ApiProperty({ example: 1, minimum: 0 })
  total!: number;
}
