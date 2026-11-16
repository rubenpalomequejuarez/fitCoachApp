# FitCoach · Web

Interfaz de FitCoach para entrenadores personales y sus clientes. Diseño *mobile-first* (390 × 844) adaptable a escritorio.

En su estado actual funciona sin servidor: los datos son de demostración y se guardan en el `localStorage` del navegador, y el acceso es simulado. La conexión con la API y la autenticación real forman parte de la siguiente fase del proyecto.

## Tecnología

| Capa | Elección | Motivo |
|---|---|---|
| Lenguaje | TypeScript estricto | Modelos de clientes, ejercicios, comidas y asignaciones comprobados al compilar |
| Interfaz | React 19 | Componentes compartidos entre pantallas |
| Compilación | Vite | Desarrollo rápido y salida estática |
| Estilo | CSS con variables, Flexbox y Grid | Sistema de diseño propio, adaptable a móvil y escritorio |
| Iconos | Lucide React | Iconografía vectorial consistente |
| Estado | Context de React + `localStorage` | Permite recorrer el ciclo entrenador → cliente sin servidor |

## Estructura

```text
src/
  App.tsx                        Navegación, perfiles y vista 390 × 844
  types.ts                       Modelos de datos
  data.ts                        Datos de demostración y validación de enlaces de YouTube
  store.tsx                      Estado y persistencia local
  domain.ts                      Reglas de negocio: copias independientes, migración, RPE y carga
  styles.css, upgrades.css       Variables y componentes
  components/ui.tsx              Botones, campos, navegación, modales, estados vacíos
  components/MealEditorCard.tsx  Formulario compartido de platos y raciones
  features/Login.tsx             Acceso
  features/Client.tsx            Dieta, recetas, rutinas y completado
  features/Trainer.tsx           Clientes, asignaciones y dieta semanal
  features/Library.tsx           Ejercicios, rutinas, platos y asignación múltiple
  features/Monitoring.tsx        Valoración de sesión, gráficas y exportación CSV
scripts/domain.test.mjs          Pruebas de las reglas de negocio
public/assets/                   Fotos, fuentes locales y SVG
design/                          Generador del kit de Figma
```

## Comandos

Desde la raíz del repositorio:

```bash
npm install
npm run dev      # http://localhost:5173
npm test
npm run build
```

`npm run build` ejecuta la comprobación de tipos y genera `apps/web/dist/`.

## Funcionalidad

**Entrenador**
- Alta y búsqueda de clientes; ficha individual con su plan.
- Biblioteca de ejercicios (con imagen o enlace de YouTube) y rutinas guardadas.
- Asignación de ejercicios, rutinas y platos a varios clientes y varios días a la vez, con selección de toda la semana.
- Ajustes por cliente (series, repeticiones, descansos, notas) que no alteran la biblioteca ni a otros clientes.
- Guardar un día personalizado como rutina reutilizable; retirar una asignación con opción de deshacer.
- Biblioteca de platos con duplicado; dieta semanal por cliente, copia de menús entre días y duplicado de comidas.
- Seguimiento de cada cliente: carga, RPE, duración y notas por sesión, con filtros de 14, 28 y 56 días, vista en tabla y exportación CSV.

**Cliente**
- Dieta semanal con cantidades, receta y notas.
- Rutina del día, detalle de cada ejercicio y marcado de completados por fecha.
- Valoración de la sesión: RPE de 0 a 10, minutos y nota opcional, corregible sin duplicar el registro.

**Búsqueda.** Todos los buscadores ignoran tildes, mayúsculas y espacios sobrantes, y admiten varias palabras en cualquier orden (`gluteo goblet` encuentra «Sentadilla goblet» en «Pierna y glúteo»).

## RPE y carga

La carga de una sesión se calcula como **RPE × duración en minutos**, en unidades arbitrarias (RPE 7 durante 45 minutos = 315 u.a.). Referencia: [Foster et al., 2001](https://pubmed.ncbi.nlm.nih.gov/11708692/).

Cada barra de la gráfica suma las cargas del día; con varias sesiones el mismo día, el RPE diario se pondera por duración. Las tendencias son descriptivas: no generan umbrales ni predicciones de lesión.

## Kit de Figma

`design/` contiene un generador que recrea las pantallas iniciales en Figma como capas, variables y componentes. Instrucciones en [design/FIGMA-LEEME.md](design/FIGMA-LEEME.md). Se empaqueta con `node design/build-figma-kit.mjs` desde esta carpeta. Las bibliotecas y el seguimiento RPE aún no están trasladados al generador.

## Vídeos

Los vídeos de YouTube se enlazan, no se incrustan. La privacidad de un vídeo no puede deducirse de su URL: los privados requieren invitar a los clientes desde YouTube; para los no listados basta el enlace.

## Recursos visuales

Tipografía Inter (Google Fonts), iconos Lucide, fotografías de Unsplash y fotografía de avena de [Nature's Path](https://naturespath.com/blogs/recipes/vanilla-chia-overnight-oats). Se incluyen en local; las fotografías son ilustrativas.
