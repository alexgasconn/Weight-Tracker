# Weight-Tracker

Aplicación web para seguimiento personal del peso corporal: registrar, visualizar, analizar estabilidad y predecir tendencias.

## Resumen

- Propósito: llevar un registro simple y bonito del peso, mostrar tendencias y volatilidad, y ofrecer predicciones a corto/medio plazo.
- Tech: React + TypeScript, Vite, Recharts.

## Archivos clave

- Entrada: [App.tsx](App.tsx)
- Gráficas: [components/WeightChart.tsx](components/WeightChart.tsx), [components/DistributionChart.tsx](components/DistributionChart.tsx)
- Predicciones: [components/PredictionSection.tsx](components/PredictionSection.tsx) y [utils/predictionUtils.ts](utils/predictionUtils.ts)
- Calendario: [components/Calendar.tsx](components/Calendar.tsx)
- Agrupados y estadísticas: [utils/statsUtils.ts](utils/statsUtils.ts)
- Servicio de datos: [services/dataService.ts](services/dataService.ts)

## Características implementadas

- Registro y eliminación de pesos.
- Vista principal con cards de resumen y gráfica de evolución.
- Suavizado configurable (MA3 por defecto ahora).
- Calendario con vistas semanal/mensual/anual y coloreado por valor (ramp global HSL, sensibilidad ajustada).
- Distribución y volatilidad con agrupado por semana/15 días/mes/trimestre.
- Motor de predicción con varios modelos y ensemble (media).

## Cómo ejecutar (desarrollo)

1. Instalar dependencias:

```bash
npm install
```

1. Levantar servidor de desarrollo:

```bash
npm run dev
```

1. Crear build de producción:

```bash
npm run build
```

## Notas rápidas

- Si el servicio de datos falla, la app usa datos de demostración.
- Fechas: `WeightRecord.date` se maneja como `Date`.

## Lista extensa de TODOs (priorizada por bloques)

Core y datos

- [ ] Onboarding para usuarios nuevos (explicar suavizados, predicciones y calendar view).
- [ ] Multi-perfil / cuentas.
- [ ] Exportar/importar CSV y compatibilidad con Apple Health / Google Fit.
- [ ] Validaciones y manejo de duplicados y fechas futuras.
- [ ] Auditoría / historial de cambios y deshacer eliminaciones.

Visual y UX

- [ ] Modo oscuro completo y pruebas de contraste.
- [ ] Mejorar accesibilidad (ARIA, lectores de pantalla, teclas rápidas).
- [ ] Tooltip enriquecido: comparación con mismo día de la semana anterior.
- [ ] Sparkline por día en calendario cuando existan múltiples registros.
- [ ] Transiciones suaves al cambiar periodos y animaciones de datos.

Calendario

- [ ] Paletas para daltónicos y temas alternativos.
- [ ] Seleccionar rango de fechas en el calendario para filtrar `timeRange` global.
- [ ] Indicar tendencia local en cada celda (pequeña flecha/regresión local).
- [ ] Soporte para múltiples registros por día (mostrar promedio/último/max).
- [ ] Importación CSV con mapeo a celdas de calendario.

Predicción y Machine Learning

- [ ] Normalización y limpieza: rellenado de huecos y detección de outliers.
- [ ] Cross-validation y métricas (MAE, RMSE) para comparar modelos.
- [ ] Implementar ARIMA/SARIMA (o usar WebAssembly para modelos más complejos).
- [ ] Implementar ensemble ponderado por rendimiento histórico.
- [ ] Guardar parámetros de modelos en `localStorage` y export/import.
- [ ] Visualizar incertidumbre con percentiles/intervalos confiables.

Rendimiento

- [ ] Optimizar agrupados y moving averages para datasets grandes.
- [ ] Calculos en Web Workers y más memoización.
- [ ] Code-splitting para módulos pesados.

Tests y CI

- [ ] Tests unitarios para `predictionUtils` y `statsUtils`.
- [ ] Tests E2E con Playwright (flujo añadir/eliminar, charts).
- [ ] GitHub Actions con lint/build/test en PRs.

Internacionalización y preferencias

- [ ] i18n con detección de locale y override por usuario.
- [ ] Persistir preferencias (tema, modelo por defecto, periodo por defecto).

Seguridad y privacidad

- [ ] Mejor manejo de credenciales y tokens si hay backend.
- [ ] Política de privacidad y herramientas para exportar/borrar datos (GDPR-ready).

Ideas avanzadas

- [ ] Notificaciones para recordar pesajes.
- [ ] Insights automáticos con IA (mensajes breves y accionables).
- [ ] Integración con Google Calendar y metas compartidas.
- [ ] PWA: instalación, offline y sincronización.
- [ ] Histórico de objetivos y comparativas.

Infra y deployment

- [ ] Dockerfile y pipeline para despliegue en Vercel/Netlify.
- [ ] Backups y migrations si se añade backend.

Prioridad sugerida (próximos pasos)

1. Tests para `predictionUtils` y `statsUtils`.
2. Onboarding y mejoras de export/import CSV.
3. PWA baseline y Dockerfile si se desea desplegar.

---
Archivo actualizado: [README.md](README.md)

Si prefieres que lo traduzca íntegramente al catalán, añada capturas de pantalla o genere tests/CI, dime cuál es la prioridad y lo hago.
