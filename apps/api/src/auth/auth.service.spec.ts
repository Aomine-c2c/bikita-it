import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
describe('AuthService', () => {
  let service: AuthService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: { employee: { count: jest.fn(), create: jest.fn() } },
        },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn() },
        },
      ],
    }).compile();
    service = module.get(AuthService);
  });
  it('should be defined', () => expect(service).toBeDefined());
  it('reports incomplete setup when no admin exists', async () => {
    const prisma = (
      service as unknown as { prisma: { employee: { count: jest.Mock } } }
    ).prisma;
    prisma.employee.count.mockResolvedValue(0);
    await expect(service.checkSetupStatus()).resolves.toEqual({
      isSetupComplete: false,
    });
  });
});
