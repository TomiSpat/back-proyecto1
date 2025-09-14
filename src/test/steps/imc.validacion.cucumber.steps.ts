import { BeforeAll, AfterAll, Given, When, Then, setDefaultTimeout } from '@cucumber/cucumber';
import { expect } from 'expect';
import request = require('supertest');
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';

// Importá de tu src (usas paths "src/..." en tu proyecto)
import { ImcController } from 'src/module/imc/imc.controller';
import { ImcService } from 'src/module/imc/imc.service';
import { IImcRepository } from 'src/module/imc/interface/IImcRepository';

// --- Estado compartido de los steps ---
let app: INestApplication;
let server: any;
let response: request.Response;

setDefaultTimeout(60_000);

// --- Mock del repositorio para no tocar DB ---
const repoMock: IImcRepository = {
  findBy: async () => ({ data: [], total: 0 }),
  findById: async () => null,
  create: async (data: any) =>
    ({ id: 1, ...data }), // devolución fake, no afecta al test de /calcular
  update: async () => null,
  delete: async () => null,
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
  // Replica tu main.ts (validación global con transform)
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
  // no-op: la app ya está levantada en BeforeAll
});

// Usamos {float} (acepta números con signo también)
When(
  'ingreso un peso de {float} kg y una altura de {float} m',
  async function (peso: number, altura: number) {
    response = await request(server).post('/imc/calcular').send({ peso, altura });
  },
);

Then('el IMC debe ser {float}', function (esperado: number) {
  expect(response.status).toBe(201);
  expect(response.body).toBeDefined();
  expect(Number(response.body.imc)).toBeCloseTo(esperado, 2);
});

Then('la categoría debe ser {string}', function (categoria: string) {
  expect(response.status).toBe(201);
  expect(response.body.categoria).toBe(categoria);
});

Then('debo ver el error {string}', function (msg: string) {
  // Permitimos 400/422 según tu pipe/excepciones
  expect(response.status).toBeGreaterThanOrEqual(400);

  const rmsg = response.body?.message;

  // Puede venir como string o como array (class-validator suele devolver array)
  if (Array.isArray(rmsg)) {
    // Aceptamos igualdad o inclusión (por si tu pipe arma mensajes compuestos)
    const big = rmsg.join(' | ');
    expect(big).toContain(msg);
  } else {
    expect(typeof rmsg === 'string').toBeTruthy();
    // Igualdad exacta si tu ValidarImcPipe lanza exactamente ese texto;
    // si preferís menos fricción, cambiá a "toContain".
    expect(rmsg).toBe(msg);
  }
});
