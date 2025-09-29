import { BeforeAll, AfterAll, Given, When, Then, setDefaultTimeout } from '@cucumber/cucumber';
import { expect } from 'expect';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ImcService } from 'src/module/imc/imc.service';
import { IImcRepository } from 'src/module/imc/interface/IImcRepository';
import { ImcEntity } from 'src/module/imc/entities/imc.entity';
import { ImcMetric } from 'src/module/imc/interface/IImcMetric';
import { ImcWeightMetric } from 'src/module/imc/interface/IImcWeightMetric';
import { ObjectId } from 'mongodb';

class InMemoryMetricRepository implements IImcRepository {
  private data: ImcEntity[] = [];
  private sequence = 1;

  clear() {
    this.data = [];
    this.sequence = 1;
  }

  async findBy(
    skip: number = 0,
    take: number = Number.MAX_SAFE_INTEGER,
    order: 'ASC' | 'DESC' = 'ASC',
    categoria?: string,
    fechaInicio?: Date,
    fechaFin?: Date,
  ): Promise<{ data: ImcEntity[]; total: number }> {
    let rows = this.filterByDate(this.data, fechaInicio, fechaFin);

    if (categoria) {
      rows = rows.filter((row) => row.categoria === categoria);
    }

    rows = [...rows].sort((a, b) =>
      order === 'ASC'
        ? a.fecha.getTime() - b.fecha.getTime()
        : b.fecha.getTime() - a.fecha.getTime(),
    );

    const total = rows.length;
    const sliced = rows.slice(skip, skip + take);

    return { data: sliced, total };
  }

  async findById(id: ObjectId): Promise<ImcEntity | null> {
    return this.data.find((row) => row.id === id) ?? null;
  }

  async create(data: any): Promise<ImcEntity> {
    const entity: ImcEntity = {
      id: new ObjectId(),
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
      const variance = rows.reduce((acc, row) => {
        const diff = Number(row.imc) - promedio;
        return acc + diff * diff;
      }, 0) / total;

      metrics.push({
        categoria,
        total,
        promedioImc: Number(promedio.toFixed(2)),
        variacionImc: Number(Math.sqrt(variance).toFixed(2)),
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
    const variance = inRange.reduce((acc, row) => {
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
let repo: InMemoryMetricRepository;

let expectedCategoryMetrics: ImcMetric[] = [];
let expectedWeightMetric: ImcWeightMetric | null = null;
let actualCategoryMetrics: ImcMetric[] = [];
let actualWeightMetric: ImcWeightMetric | null = null;

setDefaultTimeout(60_000);

BeforeAll(async () => {
  repo = new InMemoryMetricRepository();

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

Given('que el repositorio de IMC está inicializado para métricas', function () {
  repo.clear();
  expectedCategoryMetrics = [];
  expectedWeightMetric = null;
  actualCategoryMetrics = [];
  actualWeightMetric = null;
});

Given('que cargo 100 registros de IMC distribuidos por categoría', function () {
  const blueprint = [
    { categoria: 'Bajo peso', altura: 1.75, pesoInicial: 48, paso: 0.3 },
    { categoria: 'Normal', altura: 1.72, pesoInicial: 60, paso: 0.5 },
    { categoria: 'Sobrepeso', altura: 1.75, pesoInicial: 78, paso: 0.2 },
    { categoria: 'Obeso', altura: 1.65, pesoInicial: 90, paso: 0.5 },
  ];

  const categorySamples = new Map<string, number[]>();
  const weightSamples: number[] = [];

  let inserted = 0;

  blueprint.forEach(({ categoria, altura, pesoInicial, paso }) => {
    const imcs: number[] = [];

    for (let i = 0; i < 25; i += 1) {
      const peso = Number((pesoInicial + paso * i).toFixed(2));
      const result = service.calcularImc({ peso, altura } as any);

      expect(result.categoria).toBe(categoria);

      imcs.push(result.imc);
      weightSamples.push(peso);
      inserted += 1;
    }

    categorySamples.set(categoria, imcs);
  });

  expect(inserted).toBe(100);

  expectedCategoryMetrics = Array.from(categorySamples.entries()).map(([categoria, imcs]) => {
    const total = imcs.length;
    const promedio = imcs.reduce((acc, value) => acc + value, 0) / total;
    const variance = imcs.reduce((acc, value) => {
      const diff = value - promedio;
      return acc + diff * diff;
    }, 0) / total;

    return {
      categoria,
      total,
      promedioImc: Number(promedio.toFixed(2)),
      variacionImc: Number(Math.sqrt(variance).toFixed(2)),
    } as ImcMetric;
  }).sort((a, b) => a.categoria.localeCompare(b.categoria));

  const totalWeights = weightSamples.length;
  const avgWeight = weightSamples.reduce((acc, value) => acc + value, 0) / totalWeights;
  const varianceWeight = weightSamples.reduce((acc, value) => {
    const diff = value - avgWeight;
    return acc + diff * diff;
  }, 0) / totalWeights;

  expectedWeightMetric = {
    total: totalWeights,
    promedioPeso: Number(avgWeight.toFixed(2)),
    variacionPeso: Number(Math.sqrt(varianceWeight).toFixed(2)),
  };
});

When('consulto las métricas agrupadas por categoría', async function () {
  actualCategoryMetrics = await service.metricas();
  actualWeightMetric = await service.metricasPeso();
});

Then('las métricas deben contener 4 categorías', function () {
  expect(actualCategoryMetrics).toHaveLength(4);
});

Then('los resultados deben coincidir con los valores calculados del dataset', function () {
  expectedCategoryMetrics.forEach((expected) => {
    const found = actualCategoryMetrics.find((item) => item.categoria === expected.categoria);
    expect(found).toBeDefined();
    expect(found?.total).toBe(expected.total);
    expect(found?.promedioImc).toBeCloseTo(expected.promedioImc, 2);
    expect(found?.variacionImc ?? 0).toBeCloseTo(expected.variacionImc ?? 0, 2);
  });
});

Then('el resumen global de peso debe coincidir con el dataset', function () {
  expect(actualWeightMetric).not.toBeNull();
  expect(actualWeightMetric?.total).toBe(expectedWeightMetric?.total);
  expect(actualWeightMetric?.promedioPeso ?? 0).toBeCloseTo(expectedWeightMetric?.promedioPeso ?? 0, 2);
  expect(actualWeightMetric?.variacionPeso ?? 0).toBeCloseTo(expectedWeightMetric?.variacionPeso ?? 0, 2);
});
