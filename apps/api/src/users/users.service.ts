import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  create(createUserDto: CreateUserDto) {
    return this.prisma.employee.create({ data: createUserDto as any });
  }

  async findAll() {
    const employees = await this.prisma.employee.findMany({
      include: {
        _count: {
          select: { hardwareAssets: true, repairsAssigned: true }
        }
      }
    });

    return employees.map(emp => ({
      ...emp,
      assets: emp._count.hardwareAssets,
      tickets: emp._count.repairsAssigned,
    }));
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        _count: {
          select: { hardwareAssets: true, repairsAssigned: true }
        }
      }
    });
    
    if (!employee) {
      throw new NotFoundException(`Employee #${id} not found`);
    }

    return {
      ...employee,
      assets: employee._count.hardwareAssets,
      tickets: employee._count.repairsAssigned,
    };
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return this.prisma.employee.update({ where: { id }, data: updateUserDto as any });
  }

  remove(id: string) {
    return this.prisma.employee.delete({ where: { id } });
  }
}
