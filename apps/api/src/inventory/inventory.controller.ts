import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  async create(@Body() createInventoryDto: CreateInventoryDto) {
    try {
      return await this.inventoryService.create(createInventoryDto);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to create inventory item', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async findAll() {
    try {
      return await this.inventoryService.findAll();
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to fetch inventory items', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.inventoryService.findOne(id);
    } catch (error) {
      if (error.status === 404) throw error;
      throw new HttpException(
        { message: 'Failed to fetch inventory item', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
  ) {
    try {
      return await this.inventoryService.update(id, updateInventoryDto);
    } catch (error) {
      if (error.status === 404) throw error;
      throw new HttpException(
        { message: 'Failed to update inventory item', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.inventoryService.remove(id);
    } catch (error) {
      if (error.status === 404) throw error;
      throw new HttpException(
        { message: 'Failed to delete inventory item', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
