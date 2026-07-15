import { Module } from '@nestjs/common';
import { RepairsService } from './repairs.service';
import { RepairsController } from './repairs.controller';

@Module({
  controllers: [RepairsController],
  providers: [RepairsService],
})
export class RepairsModule {}
