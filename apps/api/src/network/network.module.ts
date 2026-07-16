import { Module } from '@nestjs/common';
import { NetworkService } from './network.service';
import { NetworkController } from './network.controller';
import { DiscoveryService } from './discovery.service';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NetworkController],
  providers: [NetworkService, DiscoveryService],
})
export class NetworkModule {}
