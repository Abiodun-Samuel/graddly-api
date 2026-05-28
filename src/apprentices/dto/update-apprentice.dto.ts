import { PartialType } from '@nestjs/swagger';

import { CreateApprenticeDto } from './create-apprentice.dto.js';

export class UpdateApprenticeDto extends PartialType(CreateApprenticeDto) {}
