import { PartialType } from '@nestjs/swagger';

import { CreateStandardDto } from './create-standard.dto.js';

export class UpdateStandardDto extends PartialType(CreateStandardDto) {}
