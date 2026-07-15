import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RepairsService } from './repairs.service';
import { CreateRepairDto } from './dto/create-repair.dto';
import { UpdateRepairDto } from './dto/update-repair.dto';

@Controller('repairs')
export class RepairsController {
  constructor(private readonly repairsService: RepairsService) {}

  @Post()
  create(@Body() createRepairDto: CreateRepairDto) {
    return this.repairsService.create(createRepairDto);
  }

  @Get()
  findAll() {
    return this.repairsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.repairsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRepairDto: UpdateRepairDto) {
    return this.repairsService.update(+id, updateRepairDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.repairsService.remove(+id);
  }
}
