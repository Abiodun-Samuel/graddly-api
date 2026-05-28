import { PartialType } from '@nestjs/swagger';

import { CreateProgrammeDto } from './create-programme.dto.js';

export class UpdateProgrammeDto extends PartialType(CreateProgrammeDto) {}
