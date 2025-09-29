import { BeforeAll, AfterAll, Given, When, Then, setDefaultTimeout } from '@cucumber/cucumber';
import { expect } from 'expect';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ImcService } from 'src/module/imc/imc.service';
import { IImcRepository } from 'src/module/imc/interface/IImcRepository';
import { ImcEntity } from 'src/module/imc/entities/imc.entity';
import { ImcMetric } from 'src/module/imc/interface/IImcMetric';
import { ImcWeightMetric } from 'src/module/imc/interface/IImcWeightMetric';

class InMemoryImcRepository implements IImcRepository {
  private data: ImcEntity[] = [];
  private sequence = 1;

  clear() {
    this.data = [];
    this.sequence = 1;
  }

  pushFixed(row: Omit<ImcEntity, 'id'>) {
    const entity: ImcEntity = { ...row, id: this.sequence++ };
    this.data.push(entity);
    return entity;
  }

  async findBy(
    skip = 0,
    take = Number.MAX_SAFE_INTEGER,
    order: 'ASC' | 'DESC' = 'DESC',
    categoria?: string,
    fechaInicio?: Date,
    fechaFin?: Date,
  ): Promise<{ data: ImcEntity[]; total: number }> {
    let rows = [...this.data];

    if (categoria) {
      rows = rows.filter((row) => row.categoria === categoria);
    }
    if (fechaInicio) {
      rows = rows.filter((row) => row.fecha >= fechaInicio);
    }
    if (fechaFin) {
      rows = rows.filter((row) => row.fecha <= fechaFin);
    }

    rows.sort((a, b) =>
      order === 'ASC'
        ? a.fecha.getTime() - b.fecha.getTime()
        : b.fecha.getTime() - a.fecha.getTime(),
    );

    const total = rows.length;
    const sliced = rows.slice(skip, skip + take);
    return { data: sliced, total };
  }

  async findById(id: number): Promise<ImcEntity | null> {
    return this.data.find((row) => row.id === id) ?? null;
  }

  async create(data: any): Promise<ImcEntity> {
    const entity: ImcEntity = {
      id: this.sequence++,
      peso: Number(data.peso),
      altura: Number(data.altura),
      imc: Number(data.imc),
      categoria: data.categoria,
      fecha: data.fecha instanceof Date ? data.fecha : new Date(data.fecha),
    };
    this.data.push(entity);
    return entity;
  }

  async update(): Promise<ImcEntity | null> {
    return null;
  }

  async delete(): Promise<ImcEntity | null> {
    return null;
  }

  async metricsByCategoria(
    fechaInicio?: Date,
    fechaFin?: Date,
  ): Promise<ImcMetric[]> {
    const inRange = this.filterByDate(this.data, fechaInicio, fechaFin);
    const grouped = new Map<string, ImcEntity[]>();

    for (const row of inRange) {
      const bucket = grouped.get(row.categoria) ?? [];
      bucket.push(row);
      grouped.set(row.categoria, bucket);
    }

    const metrics: ImcMetric[] = [];

    grouped.forEach((rows, categoria) => {
      const total = rows.length;
      const promedio = rows.reduce((acc, row) => acc + Number(row.imc), 0) / total;
      const variance =
        total === 0
          ? null
          : rows.reduce((acc, row) => {
              const diff = Number(row.imc) - promedio;
              return acc + diff * diff;
            }, 0) / total;
      metrics.push({
        categoria,
        total,
        promedioImc: Number(promedio.toFixed(2)),
        variacionImc: variance === null ? null : Number(Math.sqrt(variance).toFixed(2)),
      });
    });

    return metrics.sort((a, b) => a.categoria.localeCompare(b.categoria));
  }

  async pesoMetrics(
    fechaInicio?: Date,
    fechaFin?: Date,
  ): Promise<ImcWeightMetric> {
    const inRange = this.filterByDate(this.data, fechaInicio, fechaFin);
    const total = inRange.length;
    if (!total) {
      return { total: 0, promedioPeso: null, variacionPeso: null };
    }

    const promedio = inRange.reduce((acc, row) => acc + Number(row.peso), 0) / total;
    const variance =
      inRange.reduce((acc, row) => {
        const diff = Number(row.peso) - promedio;
        return acc + diff * diff;
      }, 0) / total;

    return {
      total,
      promedioPeso: Number(promedio.toFixed(2)),
      variacionPeso: Number(Math.sqrt(variance).toFixed(2)),
    };
  }

  private filterByDate(rows: ImcEntity[], fechaInicio?: Date, fechaFin?: Date): ImcEntity[] {
    return rows.filter((row) => {
      if (fechaInicio && row.fecha < fechaInicio) {
        return false;
      }
      if (fechaFin && row.fecha > fechaFin) {
        return false;
      }
      return true;
    });
  }
}

let app: INestApplication;
let service: ImcService;
let repo: InMemoryImcRepository;
let listado: Array<{
  id?: number;
  peso: number;
  altura: number;
  imc: number;
  categoria: string;
  fecha: Date;
}> = [];

setDefaultTimeout(60_000);

BeforeAll(async () => {
  repo = new InMemoryImcRepository();

  const moduleRef = await Test.createTestingModule({
    providers: [
      ImcService,
      { provide: 'IImcRepository', useValue: repo },
    ],
  }).compile();

  app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.init();
  service = app.get(ImcService);
});

AfterAll(async () => {
  await app?.close();
});

Given('que tengo un almacenamiento de IMC en memoria inicializado', function () {
  repo.clear();
});

Given('que tengo el servicio de IMC conectado a ese almacenamiento', function () {
  // El servicio ya está conectado al repositorio en memoria
});

When('calculo IMC para peso {float} y altura {float}', function (peso: number, altura: number) {
  service.calcularImc({ peso, altura } as any);
});

Then('el historial debe tener {int} registro', async function (n: number) {
  listado = (await service.historial()).data;
  expect(listado).toHaveLength(n);
});

Then('el último registro debe incluir peso {float}, altura {float}, categoría {string}', async function (
  peso: number,
  altura: number,
  categoria: string,
) {
  const rows = (await service.historial(0, 100, 'DESC')).data;
  const last = rows[0];
  console.log('Último registro:', last);
  expect(last.peso).toBe(peso);
  expect(last.altura).toBe(altura);
  expect(last.categoria).toBe(categoria);

  const esperado = Number((peso / (altura * altura)).toFixed(2));
  expect(last.imc).toBeCloseTo(esperado, 2);
});

Then('al listar el historial, el primer registro debe ser el más reciente', async function () {
  const rows = (await service.historial(0, 100, 'DESC')).data;
  expect(rows.length).toBeGreaterThanOrEqual(2);
  expect(rows[0].fecha.getTime()).toBeGreaterThanOrEqual(rows[1].fecha.getTime());
});

Given('que existe un cálculo con fecha {string} con categoria {string} en orden {string}', function (
  iso: string,
  categoria: string,
  _orden: string,
) {
  const fecha = new Date(iso);
  const peso = 70;
  const altura = 1.75;

  repo.pushFixed({
    peso,
    altura,
    imc: Number((peso / (altura * altura)).toFixed(2)),
    categoria,
    fecha,
  });
});

Given('que existe un cálculo con fecha {string}', function (iso: string) {
  const fecha = new Date(iso);
  const peso = 80;
  const altura = 1.7;

  repo.pushFixed({
    peso,
    altura,
    imc: Number((peso / (altura * altura)).toFixed(2)),
    categoria: 'Normal',
    fecha,
  });
});

When('pido el historial entre {string} y {string}', async function (fromIso: string, toIso: string) {
  listado = (await service.historial(
    0,
    100,
    'ASC',
    undefined,
    new Date(fromIso),
    new Date(toIso),
  )).data;
});

Then('el historial filtrado debe contener {int} registro', function (n: number) {
  expect(listado).toHaveLength(n);
});

Then('ese registro debe tener fecha {string}', function (iso: string) {
  expect(listado[0].fecha.toISOString()).toBe(iso);
});
