# FitCoach · A tu ritmo

Frontend navegable para entrenadores personales y sus clientes, diseñado para **390 × 844**, adaptable a móviles y escritorio. Incluye ambas perspectivas y conserva los cambios de la demo en el mismo navegador.

## Tecnología y motivo

| Capa                     | Elección                               | Motivo                                                                                                                                                                                            |
| ------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lenguaje                 | TypeScript                             | Define claramente clientes, ejercicios, comidas y asignaciones, y comprueba incompatibilidades al compilar.                                                                                       |
| Interfaz                 | React                                  | Permite compartir tarjetas, formularios, tabs, chips, botones y estados entre pantallas.                                                                                                          |
| Desarrollo y compilación | Vite                                   | Mantiene el prototipo ligero y genera archivos estáticos fáciles de servir.                                                                                                                       |
| Estilo                   | CSS con variables, Flexbox y Grid      | Reproduce el sistema de diseño y adapta el mismo contenido a móvil y escritorio.                                                                                                                  |
| Iconos                   | Lucide React                           | Iconografía vectorial consistente y de trazo fino.                                                                                                                                                |
| Estado                   | Context de React y localStorage        | Permite probar el ciclo entrenador → cliente sin necesitar un servidor.                                                                                                                           |
| Figma                    | Generador de desarrollo con Plugin API | Recrea los elementos como texto, componentes, vectores y fotos separados, con variables y auto-layout nativos. Requiere ejecutarlo en Figma; no hay un archivo Figma ya generado en esta entrega. |

Esto es un **prototipo web móvil**. No produce por sí solo un binario iOS/Android. Para la app instalable, una siguiente fase razonable es **React Native + Expo y TypeScript**: se pueden reutilizar los modelos, las reglas de validación y los tokens, y adaptar los componentes visuales a React Native. Este repositorio no incluye un proyecto Expo ni una API.

## Estructura

```text
src/
  App.tsx                    Navegación, perfiles y vista 390 × 844
  types.ts                   Modelos de datos
  data.ts                    Datos ficticios y validación de enlaces YouTube
  store.tsx                  Estado y persistencia de la demo
  styles.css                 Variables y componentes adaptables
  components/ui.tsx          Botones, campos, navegación, modales, estados vacíos
  features/Login.tsx         Acceso y recuperación simulada
  features/Client.tsx        Dieta, recetas, rutinas, detalles y completado
  features/Trainer.tsx       Clientes, asignaciones, biblioteca y dieta semanal
public/assets/               Fotos optimizadas, fuentes locales y SVG
design/generator-core.js     Generador de Figma legible y editable
design/figma-plugin/         Plugin listo para añadir a un plugin local de Figma
```

## Iniciar

Requiere una versión de Node compatible con Vite 7.

```bash
npm ci
npm run dev
npm run build
```

`npm run build` ejecuta la comprobación estricta de TypeScript y genera `dist/`. La navegación de demostración usa el fragmento de la URL.

## Recorrer los flujos

1. En el login elige **Cliente** o **Entrenador**. Los campos contienen datos de ejemplo; no son credenciales de una cuenta real. El login simula la validación, no autentica a una persona.
2. En cliente, recorre la semana, abre comidas y consulta cantidades, receta y notas. Abre un ejercicio para ver la explicación o el enlace externo y marcarlo completado.
3. En entrenador, añade clientes, busca por nombre u objetivo y abre su ficha. Crea un ejercicio con imagen o URL de YouTube válida y asígnalo a uno o varios clientes.
4. En Dietas, elige un cliente y edita cada día. Añade comidas y alimentos, completa receta y cantidades y guarda el plan.
5. Desde el avatar puedes cambiar de perfil y de cliente de demostración. **Leo Fernández** comienza sin planes, para comprobar ambos estados vacíos.
6. En escritorio, el control **390 × 844** muestra la vista móvil. **Diseño** muestra la paleta y los estados de componentes.

Los botones “Guardar y enviar” hacen que el plan aparezca dentro de esta demo. No envían correos, mensajes ni notificaciones a otras personas. Todos los datos son ficticios y se guardan únicamente en localStorage. El perfil de cliente no modifica dietas ni asignaciones; solo registra ejercicios completados.

## Figma

Lee [design/FIGMA-LEEME.md](design/FIGMA-LEEME.md). El kit incluye datos y recursos, y funciona sin acceso a internet. Se empaqueta con:

```bash
node design/build-figma-kit.mjs
```

La edición directa mediante el conector de Figma quedó bloqueada por el límite de llamadas del plan Starter. Se creó un archivo de trabajo con los cinco recursos fotográficos, pero la construcción de las pantallas fue rechazada antes de ejecutarse. Por eso se entrega el generador local, que no utiliza llamadas MCP. Su ejecución y revisión visual en Figma están pendientes; no se presenta el archivo iniciado como un diseño terminado.

## Límites para producción

Se necesitarían autenticación y permisos reales, base de datos y API, gestión de archivos, recuperación de contraseña y entrega de notificaciones. El selector de perfil es una herramienta de demostración; no constituye una barrera de seguridad.

La privacidad de un vídeo no puede deducirse solo de su URL. Los vídeos privados requieren invitar a los clientes desde YouTube; para vídeos no listados basta con el enlace según la configuración de YouTube. El ejemplo de sentadilla es público y procede de la [biblioteca oficial de NASM](https://www.nasm.org/resource-center/exercise-library/goblet-squat).

## Recursos visuales

Inter: Google Fonts. Iconos: Lucide. Fotografías de Unsplash y fotografía de avena de [Nature's Path](https://naturespath.com/blogs/recipes/vanilla-chia-overnight-oats). Se incluyen localmente para evitar dependencias remotas en la navegación; solo la vista previa opcional de un enlace YouTube consulta su miniatura externa. Las fotografías son ilustrativas y no representan exactamente cada receta de los datos ficticios.

## Verificación

- Compilación de TypeScript y Vite.
- Revisión de acceso, dieta, recetas, rutinas y completado en navegador.
- Prueba de validación, asignación múltiple y edición de dieta.
- Revisión del formato 390 × 844 y de recursos locales.
- Comprobación sintáctica y de referencias internas del generador de Figma. La revisión de su resultado dentro de Figma está pendiente.
