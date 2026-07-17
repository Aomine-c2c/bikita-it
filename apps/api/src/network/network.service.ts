import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NetworkService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.connectedDevice.create({
      data,
      include: { employee: { select: { id: true, name: true, email: true } } },
    });
  }

  async findAll(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [devices, total] = await Promise.all([
      this.prisma.connectedDevice.findMany({
        include: {
          employee: { select: { id: true, name: true, email: true } },
        },
        orderBy: { lastSeen: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.connectedDevice.count(),
    ]);

    return {
      data: devices,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findStaged() {
    return this.prisma.connectedDevice.findMany({
      where: { connectionStatus: 'STAGED' },
      include: { employee: { select: { id: true, name: true, email: true } } },
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

  async update(id: string, data: any) {
    return this.prisma.connectedDevice.update({
      where: { id },
      data,
      include: { employee: { select: { id: true, name: true, email: true } } },
    });
  }

  async remove(id: string) {
    return this.prisma.connectedDevice.delete({ where: { id } });
  }
}
