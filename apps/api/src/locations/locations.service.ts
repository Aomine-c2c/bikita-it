import { Injectable } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(createLocationDto: CreateLocationDto) {
    return this.prisma.location.create({ data: createLocationDto as any });
  }

  findAll() {
    return this.prisma.location.findMany();
  }

  async getTree() {
    const locations = await this.prisma.location.findMany({
      where: { parentId: null },
      include: {
        _count: {
          select: { assets: true },
        },
        children: {
          include: {
            _count: {
              select: { assets: true },
            },
            children: {
              include: {
                _count: {
                  select: { assets: true },
                },
                children: {
                  include: {
                    _count: {
                      select: { assets: true },
                    },
                    children: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Helper to format nodes recursively
    const formatNode = (node: any): any => ({
      id: node.id,
      name: node.name,
      type: node.type,
      assetCount: node._count?.assets || 0,
      children: node.children ? node.children.map(formatNode) : [],
    });

    return locations.map(formatNode);
  }

  findOne(id: string) {
    return this.prisma.location.findUnique({ where: { id } });
  }

  update(id: string, updateLocationDto: UpdateLocationDto) {
    return this.prisma.location.update({
      where: { id },
      data: updateLocationDto as any,
    });
  }

  remove(id: string) {
    return this.prisma.location.delete({ where: { id } });
  }
}
