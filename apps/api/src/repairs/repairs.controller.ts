import {
  Controller,
  UseInterceptors,
  UploadedFile,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RepairsService } from './repairs.service';
import { CreateRepairDto } from './dto/create-repair.dto';
import { UpdateRepairDto } from './dto/update-repair.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

@Controller('repairs')
export class RepairsController {
  constructor(private readonly repairsService: RepairsService) {}

  @Post()
  async create(@Body() createRepairDto: CreateRepairDto) {
    try {
      return await this.repairsService.create(createRepairDto);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to create repair', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }


  @Post(':id/photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(@Param('id') id: string, @UploadedFile() file: any) {
    try {
      if (!file) throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      
      const tmpdir = os.tmpdir();
      const filename = `${id}_${Date.now()}_${file.originalname}`;
      const dest = path.join(tmpdir, filename);
      fs.writeFileSync(dest, file.buffer);
      
      // We would ideally save the path to the DB, but for now just returning success
      return { message: 'Photo uploaded successfully', path: dest, url: `/uploads/${filename}` };
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to upload photo', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll() {
    try {
      return await this.repairsService.findAll();
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to fetch repairs', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.repairsService.findOne(id);
    } catch (error) {
      if (error.status === 404) throw error;
      throw new HttpException(
        { message: 'Failed to fetch repair', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRepairDto: UpdateRepairDto,
  ) {
    try {
      return await this.repairsService.update(id, updateRepairDto);
    } catch (error) {
      if (error.status === 404) throw error;
      throw new HttpException(
        { message: 'Failed to update repair', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.repairsService.remove(id);
    } catch (error) {
      if (error.status === 404) throw error;
      throw new HttpException(
        { message: 'Failed to delete repair', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
