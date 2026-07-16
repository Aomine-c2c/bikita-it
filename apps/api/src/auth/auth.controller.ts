import { Controller, Get, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('setup')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('check')
  checkSetupStatus() {
    return this.authService.checkSetupStatus();
  }

  @Post('initialize')
  initializeAdmin(@Body() body: any) {
    return this.authService.initializeAdmin(body);
  }
}
