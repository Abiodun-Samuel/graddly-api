import { ApiProperty } from '@nestjs/swagger';

export class DasLevyForecastResponseDto {
  @ApiProperty()
  organisationId!: string;

  @ApiProperty()
  horizonMonths!: number;

  @ApiProperty()
  activeEnrolmentCount!: number;

  @ApiProperty()
  projectedMonthlySpend!: number;

  @ApiProperty()
  projectedCompletionLiability!: number;

  @ApiProperty({ nullable: true })
  latestLevyBalance!: number | null;

  @ApiProperty({ nullable: true })
  estimatedRunwayMonths!: number | null;
}
