import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { NetworkService } from './network.service';
import { DiscoveryService } from './discovery.service';

@Controller('network')
export class NetworkController {
  constructor(
    private readonly networkService: NetworkService,
    private readonly discoveryService: DiscoveryService,
  ) {}

  @Post('discovery/scan')
  async triggerScan() {
    // Run asynchronously without awaiting so it doesn't block the request
    void this.discoveryService.scanNetwork();
    return { message: 'Network scan started' };
  }

  @Get('discovery/staged')
  findStaged() {
    return this.networkService.findStaged();
  }

  @Post()
  create(@Body() createNetworkDto: any) {
    return this.networkService.create(createNetworkDto);
  }

  @Get()
  findAll() {
    return this.networkService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.networkService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNetworkDto: any) {
    return this.networkService.update(id, updateNetworkDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.networkService.remove(id);
  }
}
