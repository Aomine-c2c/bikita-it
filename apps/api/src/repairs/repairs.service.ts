import { Injectable } from '@nestjs/common';
import { CreateRepairDto } from './dto/create-repair.dto';
import { UpdateRepairDto } from './dto/update-repair.dto';

@Injectable()
export class RepairsService {
  create(createRepairDto: CreateRepairDto) {
    return 'This action adds a new repair';
  }

  findAll() {
    return `This action returns all repairs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} repair`;
  }

  update(id: number, updateRepairDto: UpdateRepairDto) {
    return `This action updates a #${id} repair`;
  }

  remove(id: number) {
    return `This action removes a #${id} repair`;
  }
}
