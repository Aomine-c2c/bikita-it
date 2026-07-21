import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { InitializeAdminDto } from './initialize-admin.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './public.decorator';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Get('setup/check')
  checkSetupStatus() {
    return this.authService.checkSetupStatus();
  }

  @Public()
  @Post('setup/initialize')
  initializeAdmin(@Body() body: InitializeAdminDto) {
    return this.authService.initializeAdmin(body);
  }

  @Public()
  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
