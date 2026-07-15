import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AssetsModule } from './assets/assets.module';
import { NetworkModule } from './network/network.module';
import { TicketsModule } from './tickets/tickets.module';
import { RepairsModule } from './repairs/repairs.module';
import { SoftwareModule } from './software/software.module';
import { InventoryModule } from './inventory/inventory.module';

@Module({
  imports: [PrismaModule, UsersModule, AssetsModule, NetworkModule, TicketsModule, RepairsModule, SoftwareModule, InventoryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
