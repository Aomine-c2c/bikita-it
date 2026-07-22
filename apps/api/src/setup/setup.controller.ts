import { Controller, Get, Post, Body } from '@nestjs/common';
import { SetupService } from './setup.service';
import { Public } from '../auth/public.decorator';

@Controller('setup')
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Public()
  @Get('check')
  check() {
    return this.setupService.checkSetup();
  }

  @Public()
  @Post('initialize')
  initialize(@Body() data: any) {
    return this.setupService.initializeSetup(data);
  }
}
