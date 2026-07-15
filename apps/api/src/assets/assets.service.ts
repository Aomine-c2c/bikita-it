import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createAssetDto: CreateAssetDto) {
    return this.prisma.hardwareAsset.create({ data: createAssetDto as any });
  }

  findAll() {
    return this.prisma.hardwareAsset.findMany({
      include: {
        assignedUser: { select: { id: true, name: true, email: true } },
        location: { select: { id: true, name: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const asset = await this.prisma.hardwareAsset.findUnique({
      where: { id },
      include: {
        assignedUser: true,
        location: true,
        repairs: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!asset) throw new NotFoundException(`Asset ${id} not found`);
    return asset;
  }

  update(id: string, updateAssetDto: UpdateAssetDto) {
    return this.prisma.hardwareAsset.update({
      where: { id },
      data: updateAssetDto as any,
    });
  }

  remove(id: string) {
    return this.prisma.hardwareAsset.delete({ where: { id } });
  }
}
