import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpException, HttpStatus } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  async create(@Body() createAssetDto: CreateAssetDto) {
    try {
      return await this.assetsService.create(createAssetDto);
    } catch (error) {
      if (error.status === 404) throw error;
      throw new HttpException(
        { message: 'Failed to create asset', error: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50'
  ) {
    try {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
      return await this.assetsService.findAll(pageNum, limitNum);
    } catch (error) {
      if (error.status === 404) throw error;
      throw new HttpException(
        { message: 'Failed to fetch assets', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.assetsService.findOne(id);
    } catch (error) {
      if (error.status === 404) throw error;
      throw new HttpException(
        { message: 'Failed to fetch asset', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAssetDto: UpdateAssetDto
  ) {
    try {
      return await this.assetsService.update(id, updateAssetDto);
    } catch (error) {
      if (error.status === 404) throw error;
      throw new HttpException(
        { message: 'Failed to update asset', error: error.message },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.assetsService.remove(id);
    } catch (error) {
      if (error.status === 404) throw error;
      throw new HttpException(
        { message: 'Failed to delete asset', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

