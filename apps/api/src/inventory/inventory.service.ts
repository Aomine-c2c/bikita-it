import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createInventoryDto: CreateInventoryDto) {
    return this.prisma.inventoryItem.create({
      data: createInventoryDto
    });
  }

  async findAll(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    
    const [items, total] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        orderBy: { dateReceived: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inventoryItem.count()
    ]);

    return {
      data: items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        stockTransactions: { take: 10, orderBy: { createdAt: 'desc' } }
      }
    });
    
    if (!item) {
      throw new NotFoundException(`Inventory item ${id} not found`);
    }
    
    return item;
  }

  async update(id: string, updateInventoryDto: UpdateInventoryDto) {
    return this.prisma.inventoryItem.update({
      where: { id },
      data: updateInventoryDto
    });
  }

  async remove(id: string) {
    return this.prisma.inventoryItem.delete({
      where: { id }
    });
  }
}
