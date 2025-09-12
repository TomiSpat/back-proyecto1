// import { ImcEntity } from '../modules/imc/entities/imc.entity';
// import { ImcRecord } from '../modules/imc/imc.service';

import { ImcEntity } from "src/module/imc/entities/imc.entity";
import { ImcRecord } from "src/module/imc/imc.service";

export class MapperUtil {
  static toImcRecord(entity: ImcEntity): ImcRecord {
    return {
      peso: Number(entity.peso),
      altura: Number(entity.altura),
      imc: Number(entity.imc),
      categoria: entity.categoria,
      fecha: entity.fecha,
    };
  }
}