import { Controller, Get, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { InitializeAdminDto } from './initialize-admin.dto';

@Controller('setup')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('check')
  checkSetupStatus() {
    return this.authService.checkSetupStatus();
  }

  @Post('initialize')
  initializeAdmin(@Body() body: InitializeAdminDto) {
    return this.authService.initializeAdmin(body);
  }
}
