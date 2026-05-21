import { PartialType } from '@nestjs/swagger';

import { CreateOrganisationDto } from './create-organisation.dto.js';

// All create fields become optional on update.
// Slug is always auto-generated and is never updatable by clients.
export class UpdateOrganisationDto extends PartialType(CreateOrganisationDto) {}
