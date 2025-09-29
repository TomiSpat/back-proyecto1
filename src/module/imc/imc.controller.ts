// src/module/imc/imc.controller.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnprocessableEntityResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ImcService } from './imc.service';
import { CalcularImcDto } from './dto/calcular-imc-dto';
import { ParseDatePipe } from '../../common/pipes/parse-date.pipe';
import { ValidarImcPipe } from 'src/common/pipes/validar-imc-pipe';
import { ImcRecord } from './interface/IImcRecord';
import { ImcMetric } from './interface/IImcMetric';
import { ImcWeightMetric } from './interface/IImcWeightMetric';

@ApiTags('IMC')
@Controller('imc')
export class ImcController {
  constructor(private readonly imcService: ImcService) {}

  // -------------------------
  // POST /imc/calcular
  // -------------------------
  @Post('calcular')
  @ApiOperation({
    summary: 'Calcular IMC',
    description:
      'Recibe altura (m) y peso (kg), valida y calcula el IMC. Devuelve el registro resultante.',
  })
  @ApiBody({
    description: 'Datos necesarios para calcular el IMC',
    type: CalcularImcDto,
    examples: {
      normal: { summary: 'Ejemplo normal', value: { altura: 1.75, peso: 72 } },
      alto:   { summary: 'IMC alto',      value: { altura: 1.65, peso: 95 } },
      bajo:   { summary: 'IMC bajo',      value: { altura: 1.80, peso: 55 } },
    },
  })
  @ApiCreatedResponse({
    description: 'IMC calculado correctamente',
    schema: {
      type: 'object',
      properties: {
        id:        { type: 'number', example: 1 },
        peso:      { type: 'number', example: 72.5, description: 'kg' },
        altura:    { type: 'number', example: 1.75, description: 'm' },
        imc:       { type: 'number', example: 23.67, description: 'kg/m²' },
        categoria: { type: 'string', example: 'Normal' },
        fecha:     { type: 'string', format: 'date-time', example: '2025-09-12T12:34:56.000Z' },
      },
      required: ['id', 'peso', 'altura', 'imc', 'categoria', 'fecha'],
    },
  })
  @ApiBadRequestResponse({
    description:
      'Datos inválidos (faltan campos, tipos incorrectos o formato no válido).',
    schema: {
      example: {
        statusCode: 400,
        message: ['peso must be a number conforming to the specified constraints'],
        error: 'Bad Request',
      },
    },
  })
  @ApiUnprocessableEntityResponse({
    description:
      'La validación de negocio falló (por ejemplo, rangos de altura/peso fuera de dominio).',
    schema: {
      example: {
        statusCode: 422,
        message: 'Altura fuera de rango permitido',
        error: 'Unprocessable Entity',
      },
    },
  })
  async calcular(
    @Body(ValidarImcPipe) dto: CalcularImcDto,
  ) {
    return this.imcService.calcularImc(dto);
  }
  
  // -------------------------
  // GET /imc/historial
  // -------------------------
  @Get('historial')
  @ApiOperation({
    summary: 'Obtener historial de cálculos',
    description:
      'Devuelve un array de registros de IMC. Permite paginar y filtrar por fecha, categoría y orden.',
  })
  @ApiQuery({ name: 'skip', required: false, type: Number, example: 0, description: 'Offset/paginación' })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 20, description: 'Cantidad a devolver' })
  @ApiQuery({ name: 'order', required: false, enum: ['ASC', 'DESC'], description: 'Orden por fecha' })
  @ApiQuery({ name: 'categoria', required: false, type: String, description: 'Filtro por categoría (e.g., Normal, Obesidad)' })
  @ApiQuery({ name: 'from', required: false, type: String, example: '2025-09-01', description: 'Fecha desde (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to',   required: false, type: String, example: '2025-09-12', description: 'Fecha hasta (YYYY-MM-DD)' })
  @ApiOkResponse({
    description: 'Listado de cálculos recuperado correctamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id:        { type: 'number', example: 12 },
          peso:      { type: 'number', example: 80 },
          altura:    { type: 'number', example: 1.8 },
          imc:       { type: 'number', example: 24.69 },
          categoria: { type: 'string', example: 'Normal' },
          fecha:     { type: 'string', format: 'date-time', example: '2025-09-10T09:15:00.000Z' },
        },
        required: ['id', 'peso', 'altura', 'imc', 'categoria', 'fecha'],
      },
      example: [
        {
          id: 10,
          peso: 72.5,
          altura: 1.75,
          imc: 23.67,
          categoria: 'Normal',
          fecha: '2025-09-01T10:00:00.000Z',
        },
        {
          id: 11,
          peso: 95,
          altura: 1.65,
          imc: 34.89,
          categoria: 'Obesidad',
          fecha: '2025-09-05T09:15:00.000Z',
        },
      ],
    },
  })
  @ApiBadRequestResponse({
    description: 'Formato de fecha inválido en los parámetros.',
    schema: { example: { statusCode: 400, message: 'Fecha inválida: use YYYY-MM-DD', error: 'Bad Request' } },
  })
  async historial(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('order') order?: 'ASC' | 'DESC',
    @Query('categoria') categoria?: string,
    @Query('from', ParseDatePipe) fechaInicio?: Date,
    @Query('to', ParseDatePipe) fechaFin?: Date,
  ): Promise<{ data: ImcRecord[]; total: number }> {

    const { data, total } = await this.imcService.historial(skip, take, order, categoria, fechaInicio, fechaFin);

    return { data, total };
  }

  // -------------------------
  // GET /imc/metricas
  // -------------------------
  @Get('metricas')
  @ApiOperation({
    summary: 'Consultar métricas agregadas por categoría',
    description:
      'Devuelve, para cada categoría, la cantidad de registros, el IMC promedio y la variación (desviación estándar poblacional).',
  })
  @ApiQuery({ name: 'from', required: false, type: String, example: '2025-09-01', description: 'Fecha desde (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to',   required: false, type: String, example: '2025-09-12', description: 'Fecha hasta (YYYY-MM-DD)' })
  @ApiOkResponse({
    description: 'Métricas agregadas calculadas correctamente',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          categoria: { type: 'string', example: 'Normal' },
          total: { type: 'number', example: 12 },
          promedioImc: { type: 'number', example: 23.45 },
          variacionImc: { type: 'number', nullable: true, example: 1.72 },
        },
        required: ['categoria', 'total', 'promedioImc', 'variacionImc'],
      },
    },
  })
  async metricas(
    @Query('from', ParseDatePipe) fechaInicio?: Date,
    @Query('to', ParseDatePipe) fechaFin?: Date,
  ): Promise<ImcMetric[]> {
    return this.imcService.metricas(fechaInicio, fechaFin);
  }

  // -------------------------
  // GET /imc/metricas/peso
  // -------------------------
  @Get('metricas/peso')
  @ApiOperation({
    summary: 'Consultar métricas globales de peso',
    description: 'Entrega el total de registros, junto al promedio y la variación (desviación estándar poblacional) del peso registrado.',
  })
  @ApiQuery({ name: 'from', required: false, type: String, example: '2025-09-01', description: 'Fecha desde (YYYY-MM-DD)' })
  @ApiQuery({ name: 'to',   required: false, type: String, example: '2025-09-12', description: 'Fecha hasta (YYYY-MM-DD)' })
  @ApiOkResponse({
    description: 'Métricas globales calculadas correctamente',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 42 },
        promedioPeso: { type: 'number', nullable: true, example: 76.3 },
        variacionPeso: { type: 'number', nullable: true, example: 3.5 },
      },
      required: ['total', 'promedioPeso', 'variacionPeso'],
    },
  })
  async metricasPeso(
    @Query('from', ParseDatePipe) fechaInicio?: Date,
    @Query('to', ParseDatePipe) fechaFin?: Date,
  ): Promise<ImcWeightMetric> {
    return this.imcService.metricasPeso(fechaInicio, fechaFin);
  }
}
