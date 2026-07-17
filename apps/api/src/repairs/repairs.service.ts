import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRepairDto } from './dto/create-repair.dto';
import { UpdateRepairDto } from './dto/update-repair.dto';

@Injectable()
export class RepairsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRepairDto: CreateRepairDto) {
    return this.prisma.repair.create({
      data: createRepairDto,
      include: {
        hardware: { select: { id: true, tag: true, make: true, model: true } },
        technician: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findAll(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [repairs, total] = await Promise.all([
      this.prisma.repair.findMany({
        include: {
          hardware: {
            select: { id: true, tag: true, make: true, model: true },
          },
          technician: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.repair.count(),
    ]);

    return {
      data: repairs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const repair = await this.prisma.repair.findUnique({
      where: { id },
      include: {
        hardware: true,
        technician: true,
      },
    });

    if (!repair) {
      throw new NotFoundException(`Repair ${id} not found`);
    }

    return repair;
  }

  async update(id: string, updateRepairDto: UpdateRepairDto) {
    return this.prisma.repair.update({
      where: { id },
      data: updateRepairDto,
      include: {
        hardware: { select: { id: true, tag: true, make: true, model: true } },
        technician: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.repair.delete({
      where: { id },
    });
  }
}
