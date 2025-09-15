import { ImcEntity } from "src/module/imc/entities/imc.entity";
import { ImcRecord } from "src/module/imc/interface/IImcRecord";

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