import { Test, TestingModule } from "@nestjs/testing";
import { ImcService } from "./imc.service";
import { CalcularImcDto } from "./dto/calcular-imc-dto";


describe('ImcService', () => {
  let service: ImcService;
  let repository: {
    create: jest.Mock;
    findBy: jest.Mock;
    metricsByCategoria: jest.Mock;
    findById: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findBy: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      metricsByCategoria: jest.fn().mockResolvedValue([]),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImcService,
        {
          provide: 'IImcRepository',
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<ImcService>(ImcService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate IMC correctly', () => {
    const dto: CalcularImcDto = { altura: 1.75, peso: 70 };
    const result = service.calcularImc(dto);
    expect(result.imc).toBeCloseTo(22.86, 2); // Redondeado a 2 decimales
    expect(result.categoria).toBe('Normal');
    expect(repository.create).toHaveBeenCalled();
  });

  it('should return Bajo peso for IMC < 18.5', () => {
    const dto: CalcularImcDto = { altura: 1.75, peso: 50 };
    const result = service.calcularImc(dto);
    expect(result.imc).toBeCloseTo(16.33, 2);
    expect(result.categoria).toBe('Bajo peso');
  });

  it('should return Sobrepeso for 25 <= IMC < 30', () => {
    const dto: CalcularImcDto = { altura: 1.75, peso: 80 };
    const result = service.calcularImc(dto);
    expect(result.imc).toBeCloseTo(26.12, 2);
    expect(result.categoria).toBe('Sobrepeso');
  });

  it('should return Obeso for IMC >= 30', () => {
    const dto: CalcularImcDto = { altura: 1.75, peso: 100 };
    const result = service.calcularImc(dto);
    expect(result.imc).toBeCloseTo(32.65, 2);
    expect(result.categoria).toBe('Obeso');
  });

  it('should retrieve metrics grouped by category', async () => {
    const since = new Date('2025-01-01T00:00:00.000Z');
    const until = new Date('2025-12-31T23:59:59.000Z');
    repository.metricsByCategoria.mockResolvedValue([
      { categoria: 'Normal', total: '2', promedioImc: '23.45', variacionImc: '1.23' },
      { categoria: 'Obeso', total: '1', promedioImc: '31.00', variacionImc: null },
    ]);

    const result = await service.metricas(since, until);

    expect(repository.metricsByCategoria).toHaveBeenCalledWith(since, until);
    expect(result).toEqual([
      { categoria: 'Normal', total: 2, promedioImc: 23.45, variacionImc: 1.23 },
      { categoria: 'Obeso', total: 1, promedioImc: 31, variacionImc: null },
    ]);
  });
});
