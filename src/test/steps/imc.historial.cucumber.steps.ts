// import { BeforeAll, AfterAll, Given, When, Then, setDefaultTimeout } from '@cucumber/cucumber';
// import { expect } from 'expect';
// import { INestApplication, ValidationPipe } from '@nestjs/common';
// import { Test } from '@nestjs/testing';
// import { ImcService } from 'src/module/imc/imc.service';
// import { IImcRepository } from 'src/module/imc/interface/IImcRepository';
// import { ImcEntity } from 'src/module/imc/entities/imc.entity';

// // ---------- Repo en memoria que implementa IImcRepository ----------
// class InMemoryImcRepository implements IImcRepository {
//   private data: ImcEntity[] = [];
//   private id = 1;

//   clear() {
//     this.data = [];
//     this.id = 1;
//   }

//   // Inserta un registro “a mano” (para escenarios Given con fechas específicas)
//   pushFixed(row: Omit<ImcEntity, 'id'>) {
//     const rec: ImcEntity = { ...row, id: this.id++ };
//     this.data.push(rec);
//     return rec;
//   }

//   async findBy(
//     skip = 0,
//     take = Number.MAX_SAFE_INTEGER,
//     order: 'ASC' | 'DESC' = 'DESC',
//     categoria?: string,
//     fechaInicio?: Date,
//     fechaFin?: Date,
//   ): Promise<{ data: ImcEntity[]; total: number }> {
//     let rows = [...this.data];

//     if (categoria) rows = rows.filter(r => r.categoria === categoria);
//     if (fechaInicio) rows = rows.filter(r => r.fecha >= fechaInicio);
//     if (fechaFin) rows = rows.filter(r => r.fecha <= fechaFin);

//     rows.sort((a, b) =>
//       order === 'ASC'
//         ? a.fecha.getTime() - b.fecha.getTime()
//         : b.fecha.getTime() - a.fecha.getTime(),
//     );

//     const total = rows.length;
//     const sliced = rows.slice(skip, skip + take);
//     return { data: sliced, total };
//   }

//   async findById(id: number): Promise<ImcEntity | null> {
//     return this.data.find(r => r.id === id) ?? null;
//   }

//   // Nota: tu service llama create(...) con GuardarImcDto (peso,altura,imc,categoria,fecha)
//   // aunque la interfaz dice CalcularImcDto. Permitimos "any" para compatibilidad.
//   async create(data: any): Promise<ImcEntity> {
//     const rec: ImcEntity = {
//       id: this.id++,
//       peso: Number(data.peso),
//       altura: Number(data.altura),
//       imc: Number(data.imc),
//       categoria: data.categoria,
//       fecha: data.fecha instanceof Date ? data.fecha : new Date(data.fecha),
//       userId: data.userId ?? null,
//     };
//     this.data.push(rec);
//     return rec;
//   }

//   async update(): Promise<ImcEntity | null> {
//     return null; // no se usa en estos tests
//   }

//   async delete(): Promise<ImcEntity | null> {
//     return null; // no se usa en estos tests
//   }
// }

// // ---------- Estado de test ----------
// let app: INestApplication;
// let service: ImcService;
// let repo: InMemoryImcRepository;
// let listado: Array<{
//   id?: number;
//   peso: number;
//   altura: number;
//   imc: number;
//   categoria: string;
//   fecha: Date;
//   userId?: string | null;
// }> = [];

// setDefaultTimeout(60_000);

// BeforeAll(async () => {
//   repo = new InMemoryImcRepository();

//   const moduleRef = await Test.createTestingModule({
//     providers: [
//       ImcService,
//       { provide: 'IImcRepository', useValue: repo },
//     ],
//   }).compile();

//   app = moduleRef.createNestApplication();
//   // Replica tu main.ts
//   app.useGlobalPipes(
//     new ValidationPipe({
//       whitelist: true,
//       forbidNonWhitelisted: true,
//       transform: true,
//       transformOptions: { enableImplicitConversion: true },
//     }),
//   );
//   await app.init();

//   service = app.get(ImcService);
// });

// AfterAll(async () => {
//   await app?.close();
// });

// // ---------- Steps ----------

// Given('que tengo un almacenamiento de IMC en memoria inicializado', function () {
//   repo.clear();
// });

// Given('que tengo el servicio de IMC conectado a ese almacenamiento', function () {
//   // no-op (ya está inyectado en BeforeAll)
// });

// When('calculo IMC para peso {float} y altura {float}', function (peso: number, altura: number) {
//   // Esto persiste vía repo.create(...) dentro del service
//   service.calcularImc({ peso, altura } as any);
// });

// Then('el historial debe tener {int} registro', async function (n: number) {
//   listado = await service.historial(); // params opcionales
//   expect(listado).toHaveLength(n);
// });

// Then(
//   'el último registro debe incluir peso {float}, altura {float}, categoría {string}',
//   async function (p: number, a: number, cat: string) {
//     const rows = await service.historial(0, 100, 'DESC'); // aseguramos orden desc
//     const last = rows[0];
//     expect(last.peso).toBe(p);
//     expect(last.altura).toBe(a);
//     expect(last.categoria).toBe(cat);
//     const esperado = Number((p / (a * a)).toFixed(2));
//     expect(last.imc).toBeCloseTo(esperado, 2);
//   },
// );

// Then('al listar el historial, el primer registro debe ser el más reciente', async function () {
//   const rows = await service.historial(0, 100, 'DESC');
//   expect(rows.length).toBeGreaterThanOrEqual(2);
//   expect(rows[0].fecha.getTime()).toBeGreaterThanOrEqual(rows[1].fecha.getTime());
// });

// Given(
//   'que existe un cálculo con fecha {string} con categoria {string} en orden {string}',
//   function (iso: string, cat: string, _ord: string) {
//     // "orden" se usa al listar, no es campo del registro; lo ignoramos acá
//     const fecha = new Date(iso);
//     const peso = 70;
//     const altura = 1.75;
//     repo.pushFixed({
//       peso,
//       altura,
//       imc: Number((peso / (altura ** 2)).toFixed(2)),
//       categoria: cat,
//       fecha,
//       userId: 'Usuario prueba',
//     });
//   },
// );

// Given('que existe un cálculo con fecha {string}', function (iso: string) {
//   const fecha = new Date(iso);
//   const peso = 80;
//   const altura = 1.7;
//   repo.pushFixed({
//     peso,
//     altura,
//     imc: Number((peso / (altura ** 2)).toFixed(2)),
//     categoria: 'Normal',
//     fecha,
//     // userId: null,
//   });
// });

// When('pido el historial entre {string} y {string}', async function (fromIso: string, toIso: string) {
//   listado = await service.historial(
//     0,
//     100,
//     'ASC',           // pedimos ascendente para facilitar la aserción si quisieras
//     undefined,       // sin filtrar por categoría
//     new Date(fromIso),
//     new Date(toIso),
//   );
// });

// Then('el historial filtrado debe contener {int} registro', function (n: number) {
//   expect(listado).toHaveLength(n);
// });

// Then('ese registro debe tener fecha {string}', function (iso: string) {
//   // service.historial devuelve Date real (no JSON), así que comparamos con toISOString()
//   expect(listado[0].fecha.toISOString()).toBe(iso);
// });
