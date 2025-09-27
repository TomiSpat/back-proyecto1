import { BeforeAll, AfterAll, Given, When, Then, setDefaultTimeout } from '@cucumber/cucumber';
import { expect } from 'expect';
import request = require('supertest');
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ImcController } from 'src/module/imc/imc.controller';
import { ImcService } from 'src/module/imc/imc.service';
import { IImcRepository } from 'src/module/imc/interface/IImcRepository';
import { ImcMetric } from 'src/module/imc/interface/IImcMetric';
import { ImcWeightMetric } from 'src/module/imc/interface/IImcWeightMetric';

let app: INestApplication;
let server: any;
let response: request.Response;

setDefaultTimeout(60_000);

const repoMock: IImcRepository = {
  findBy: async () => ({ data: [], total: 0 }),
  findById: async () => null,
  create: async (data: any) => ({ id: 1, ...data }),
  update: async () => null,
  delete: async () => null,
  metricsByCategoria: async (): Promise<ImcMetric[]> => [],
  pesoMetrics: async (): Promise<ImcWeightMetric> => ({ total: 0, promedioPeso: null, variacionPeso: null }),
};

BeforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    controllers: [ImcController],
    providers: [
      ImcService,
      { provide: 'IImcRepository', useValue: repoMock },
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
  server = app.getHttpServer();
});

AfterAll(async () => {
  await app?.close();
});

Given('que tengo el servicio de IMC disponible', function () {
  // Aplicación levantada en el BeforeAll
});

When('ingreso un peso de {float} kg y una altura de {float} m', async function (
  peso: number,
  altura: number,
) {
  response = await request(server).post('/imc/calcular').send({ peso, altura });
});

Then('el IMC debe ser {float}', function (esperado: number) {
  expect(response.status).toBe(201);
  expect(response.body).toBeDefined();
  expect(Number(response.body.imc)).toBeCloseTo(esperado, 2);
});

Then('la categoría debe ser {string}', function (categoria: string) {
  expect(response.status).toBe(201);
  expect(response.body.categoria).toBe(categoria);
});

Then('debo ver el error {string}', function (mensajeEsperado: string) {
  expect(response.status).toBeGreaterThanOrEqual(400);

  const mensaje = response.body?.message;

  if (Array.isArray(mensaje)) {
    expect(mensaje.join(' | ')).toContain(mensajeEsperado);
  } else {
    expect(typeof mensaje === 'string').toBeTruthy();
    expect(mensaje).toContain(mensajeEsperado);
  }
});
