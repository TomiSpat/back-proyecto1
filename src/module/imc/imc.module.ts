import { Module } from '@nestjs/common';
import { ImcService } from './imc.service';
import { ImcController } from './imc.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImcEntity } from './entities/imc.entity';
import { ImcRepository } from './imc.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ImcEntity])],
  controllers: [ImcController],
  providers: [
    ImcService, 
    {
      //se define el uso de la interfaz IImcRepository
      provide: 'IImcRepository',
      useClass: ImcRepository
    }
  ],
  exports: [ImcService, TypeOrmModule],
})
export class ImcModule { }
