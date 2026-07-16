import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AssetsModule } from './assets/assets.module';
import { NetworkModule } from './network/network.module';
import { RepairsModule } from './repairs/repairs.module';
import { InventoryModule } from './inventory/inventory.module';
import { ScheduleModule } from '@nestjs/schedule';


import { AuthModule } from './auth/auth.module';
import { BackupModule } from './backup/backup.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AssetsModule,
    NetworkModule,
    RepairsModule,
    InventoryModule,
    AuthModule,
    BackupModule,
    ScheduleModule.forRoot()
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
