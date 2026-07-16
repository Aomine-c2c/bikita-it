import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NetworkService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.connectedDevice.create({ data });
  }

  findAll() {
    return this.prisma.connectedDevice.findMany({
      include: { employee: true },
      orderBy: { lastSeen: 'desc' },
    });
  }

  async findOne(id: string) {
    const device = await this.prisma.connectedDevice.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!device) throw new NotFoundException('Device not found');
    return device;
  }

  update(id: string, data: any) {
    return this.prisma.connectedDevice.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.connectedDevice.delete({ where: { id } });
  }
}
