import { Injectable } from '@nestjs/common';
import { CreateSetupDto } from './dto/create-setup.dto';
import { UpdateSetupDto } from './dto/update-setup.dto';

@Injectable()
export class SetupService {
  create(createSetupDto: CreateSetupDto) {
    return 'This action adds a new setup';
  }

  findAll() {
    return `This action returns all setup`;
  }

  findOne(id: number) {
    return `This action returns a #${id} setup`;
  }

  update(id: number, updateSetupDto: UpdateSetupDto) {
    return `This action updates a #${id} setup`;
  }

  remove(id: number) {
    return `This action removes a #${id} setup`;
  }
}
