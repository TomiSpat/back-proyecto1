import { ImcEntity } from "src/module/imc/entities/imc.entity";
import { ImcRecord } from "src/module/imc/interface/IImcRecord";
import { ImcMetric } from "src/module/imc/interface/IImcMetric";

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

  static toImcMetric(raw: { categoria: string; total: string | number; promedioImc: string | number; variacionImc: string | number | null; }): ImcMetric {
    return {
      categoria: raw.categoria,
      total: typeof raw.total === 'string' ? Number(raw.total) : raw.total,
      promedioImc: typeof raw.promedioImc === 'string' ? Number(raw.promedioImc) : raw.promedioImc,
      variacionImc: raw.variacionImc === null
        ? null
        : typeof raw.variacionImc === 'string'
          ? Number(raw.variacionImc)
          : raw.variacionImc,
    };
  }
}
