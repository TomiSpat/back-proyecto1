Feature: CR-003.1 - Dashboard de estadísticas
  Como analista
  Quiero ver métricas agregadas de los cálculos de IMC
  Para validar que el dashboard muestre información confiable incluso con muchos datos

  Background:
    Given que el repositorio de IMC está inicializado para métricas

  @dashboard
  Scenario: Consultar métricas agregadas con dataset masivo
    Given que cargo 100 registros de IMC distribuidos por categoría
    When consulto las métricas agrupadas por categoría
    Then las métricas deben contener 4 categorías
    And los resultados deben coincidir con los valores calculados del dataset
    And el resumen global de peso debe coincidir con el dataset
