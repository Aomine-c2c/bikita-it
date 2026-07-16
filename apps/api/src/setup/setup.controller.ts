import { Controller, Get, Post, Body } from '@nestjs/common';
import { SetupService } from './setup.service';

@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Get('check')
  check() {
    return this.setupService.checkSetup();
  }

  @Post('initialize')
  initialize(@Body() data: any) {
    return this.setupService.initializeSetup(data);
  }
}
