Feature: CR-002 - Persistencia y consulta de historial de cálculos
  Como usuario
  Quiero que cada cálculo se guarde y pueda consultar mi historial
  Para ver mis resultados anteriores y analizarlos

  Background:
    Given que tengo un almacenamiento de IMC en memoria inicializado
    And que tengo el servicio de IMC conectado a ese almacenamiento

  @persistir
  Scenario: Guardar automáticamente tras un cálculo
    When calculo IMC para peso 70 y altura 1.75
    Then el historial debe tener 1 registro
    And el último registro debe incluir peso 70, altura 1.75, categoría "Normal"

  @orden
  Scenario: Orden descendente por fecha
    When calculo IMC para peso 80 y altura 1.70
    And calculo IMC para peso 65 y altura 1.65
    Then al listar el historial, el primer registro debe ser el más reciente

  @filtro
  Scenario: Filtrar por rango de fechas
    Given que existe un cálculo con fecha "2024-01-15T10:00:00.000Z" con categoria "Normal" en orden "ASC"
    And que existe un cálculo con fecha "2025-01-15T10:00:00.000Z"
    When pido el historial entre "2024-12-31T00:00:00.000Z" y "2025-12-31T23:59:59.000Z"
    Then el historial filtrado debe contener 1 registro
    And ese registro debe tener fecha "2025-01-15T10:00:00.000Z"
