// // src/module/imc/imc.service.ts
// import { Injectable, Optional } from "@nestjs/common";
// import { CalcularImcDto } from "./dto/calcular-imc-dto";

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

// @Injectable()
// export class ImcService {
//   constructor(@Optional() private readonly store?: ImcStore) {}

//   calcularImc(data: CalcularImcDto, userId?: string) { // 👈 opcional
//     const { altura, peso } = data;

//     if (!(peso > 0) || peso >= 500) throw new Error('Valores inválidos: peso debe ser > 0 y < 500');
//     if (!(altura > 0) || altura >= 3) throw new Error('Valores inválidos: altura debe ser > 0 y < 3');

//     const imc = Number((peso / (altura * altura)).toFixed(2));
//     const categoria =
//       imc < 18.5 ? 'Bajo peso' :
//       imc < 25   ? 'Normal'    :
//       imc < 30   ? 'Sobrepeso' : 'Obeso';

//     if (this.store) {
//       this.store.save({ peso, altura, imc, categoria, fecha: new Date(), userId });
//     }
//     return { imc, categoria };
//   }

//   async historial(params?: { from?: Date; to?: Date; userId?: string }) {
//     if (!this.store) return [];
//     const rows = await this.store.list(params);
//     return rows.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
//   }
// }

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


