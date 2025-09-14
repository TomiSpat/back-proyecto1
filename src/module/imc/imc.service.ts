
export interface ImcRecord {
  id?: number;
  peso: number;
  altura: number;
  imc: number;
  categoria: string;
  fecha: Date;
  userId?: string | null; // 👈 sin null
}

export abstract class ImcStore {
  abstract save(rec: ImcRecord): Promise<ImcRecord>;
  abstract list(params?: { from?: Date; to?: Date; userId?: string }): Promise<ImcRecord[]>;
}

import { Inject, Injectable } from '@nestjs/common';
import { CalcularImcDto } from './dto/calcular-imc-dto';
import { GuardarImcDto } from './dto/guardar-imc-dto';
import { IImcRepository } from './interface/IImcRepository';
import { InjectRepository } from '@nestjs/typeorm';
import { MapperUtil } from 'src/common/utils/mapper.util';

@Injectable()
export class ImcService {
  constructor(
    @Inject('IImcRepository')
    private readonly imcRepository: IImcRepository) { }


  calcularImc(data: CalcularImcDto, userId: string | null = null) {
    const { altura, peso } = data;

    const imc = peso / (altura * altura);
    const imcRedondeado = Number(imc.toFixed(2));

    let categoria: string;
    if (imc < 18.5) categoria = 'Bajo peso';
    else if (imc < 25) categoria = 'Normal';
    else if (imc < 30) categoria = 'Sobrepeso';
    else categoria = 'Obeso';

    // Resultado para devolver al cliente
    const result = { imc: imcRedondeado, categoria };

    // Persistir en BD
    const rec: GuardarImcDto = {
      peso,
      altura,
      imc: imcRedondeado,
      categoria,
      fecha: new Date(),
    };

    this.imcRepository.create(rec);

    return result;
  }

  async historial(skip?: number,
    take?: number,
    order?: 'ASC' | 'DESC',
    categoria?: string,
    fechaInicio?: Date,
    fechaFin?: Date,
    ) {
    const { data } = await this.imcRepository.findBy(skip, take, order, categoria, fechaInicio, fechaFin);
    
    return data.map(MapperUtil.toImcRecord);
  }
}


