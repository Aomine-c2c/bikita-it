from pathlib import Path
root=Path(r'C:\Users\armut\404\BikitaIT\apps\api\src\auth')
(root/'auth.service.spec.ts').write_text("""import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
describe('AuthService', () => {
  let service: AuthService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ providers: [AuthService, { provide: PrismaService, useValue: { employee: { count: jest.fn(), create: jest.fn() } } }] }).compile();
    service = module.get(AuthService);
  });
  it('should be defined', () => expect(service).toBeDefined());
  it('reports incomplete setup when no admin exists', async () => {
    const prisma = (service as unknown as { prisma: { employee: { count: jest.Mock } } }).prisma;
    prisma.employee.count.mockResolvedValue(0);
    await expect(service.checkSetupStatus()).resolves.toEqual({ isSetupComplete: false });
  });
});
""")
(root/'auth.controller.spec.ts').write_text("""import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
describe('AuthController', () => {
  let controller: AuthController;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({ controllers: [AuthController], providers: [{ provide: AuthService, useValue: { checkSetupStatus: jest.fn(), initializeAdmin: jest.fn() } }] }).compile();
    controller = module.get(AuthController);
  });
  it('should be defined', () => expect(controller).toBeDefined());
});
""")
print('unit tests repaired')
