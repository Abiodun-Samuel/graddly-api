import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { KsbKind } from '../enums/ksb-kind.enum.js';

export class KsbDefinitionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organisationId!: string;

  @ApiProperty({ format: 'uuid' })
  standardId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ enum: KsbKind })
  kind!: KsbKind;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty()
  sortOrder!: number;
}
