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
import { NetworkService } from './network.service';
import { DiscoveryService } from './discovery.service';
import { CreateNetworkDto } from './dto/create-network.dto';
import { UpdateNetworkDto } from './dto/update-network.dto';

@Controller('network')
export class NetworkController {
  constructor(
    private readonly networkService: NetworkService,
    private readonly discoveryService: DiscoveryService,
  ) {}

  @Post('discovery/scan')
  async triggerScan() {
    try {
      void this.discoveryService.scanNetwork();
      return { message: 'Network scan started' };
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to start network scan', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('discovery/promote/:id')
  async promoteStaged(@Param('id') id: string) {
    try {
      return await this.networkService.promoteStaged(id);
    } catch (error) {
      if (error.status === 404) throw error;
      throw new HttpException(
        { message: 'Failed to promote device', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('discovery/staged')
  async findStaged() {
    try {
      return await this.networkService.findStaged();
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to fetch staged devices', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async create(@Body() createNetworkDto: CreateNetworkDto) {
    try {
      return await this.networkService.create(createNetworkDto);
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to create network device', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async findAll() {
    try {
      return await this.networkService.findAll();
    } catch (error) {
      throw new HttpException(
        { message: 'Failed to fetch network devices', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.networkService.findOne(id);
    } catch (error) {
      if (error.status === 404) throw error;
      throw new HttpException(
        { message: 'Failed to fetch network device', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateNetworkDto: UpdateNetworkDto,
  ) {
    try {
      return await this.networkService.update(id, updateNetworkDto);
    } catch (error) {
      if (error.status === 404) throw error;
      throw new HttpException(
        { message: 'Failed to update network device', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.networkService.remove(id);
    } catch (error) {
      if (error.status === 404) throw error;
      throw new HttpException(
        { message: 'Failed to delete network device', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
