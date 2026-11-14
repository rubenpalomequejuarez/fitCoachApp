# FitCoach · Kit editable para Figma

Este paquete contiene un generador local de capas, variables, componentes con variantes y conexiones de prototipo. No es un archivo `.fig` ya creado. No se ha ejecutado ni verificado dentro de Figma en esta sesión: el servicio bloqueó la construcción por el límite de llamadas del plan Starter. El generador local no utiliza esas llamadas MCP.

## Crear el diseño

1. Abre Figma Desktop y un archivo Design vacío. También puedes usar el [archivo de trabajo iniciado](https://www.figma.com/design/qIEphA1fJydUAP26mbTSQm), que actualmente contiene solo cinco fotografías de referencia; todavía no contiene las pantallas ni las variables.
2. En el menú de plugins, elige **Development → New plugin** y crea un plugin vacío que se ejecute una vez (**Run once**). Figma generará un `manifest.json` con tu propio ID. Conserva ese ID: no necesitas publicar el plugin.
3. Sustituye el archivo `code.js` generado por el `code.js` de este paquete. No requiere compilación, dependencias ni acceso a internet.
4. En tu `manifest.json`, conserva el `id` de Figma y utiliza los demás campos de `manifest.template.json`. No importes directamente la plantilla sin ID.
5. Ejecuta el plugin desde **Plugins → Development**. Creará una página nueva llamada **FitCoach · Diseño y prototipo**. No modifica las páginas existentes. Evita ejecutarlo varias veces en el mismo archivo si no quieres varias páginas.
6. Abre **Present** desde **Acceso · Cliente** o **Acceso · Entrenador**. Todos los fotogramas miden **390 × 844**.

## Incluido

- Paleta exacta, variables semánticas enlazadas a primitivos, espaciado, radios y tipografía Inter, con sintaxis CSS.
- Botones principal, secundario y terracota con estados normal, pulsado y deshabilitado; inputs; tarjetas de comida, ejercicio y cliente; pestañas; chips; checkbox.
- Capas de texto editables, iconos vectoriales y fotografías separadas como rellenos de imagen. No se utiliza ninguna captura de pantalla para representar la interfaz.
- Acceso por perfil, recuperación y errores.
- Cliente: los siete días, recetas, tres rutinas, detalles de ejercicio, vídeo externo, completado y estados vacíos.
- Entrenador: clientes, añadir y errores, ficha, biblioteca, formularios de imagen/vídeo, validación, selección múltiple, confirmación, dieta semanal, alimentos y guardado.
- Contenedores con auto-layout y áreas de contenido con desplazamiento vertical. Navegación inferior persistente.

## Cómo se comporta el prototipo de Figma

Las conexiones recorren estados representativos. Figma simula formularios mediante transiciones a pantallas rellenadas; no ejecuta la lógica de React ni guarda datos reales. El prototipo web sí permite introducir datos, validarlos, asignar a varios clientes y consultar los cambios dentro del mismo navegador.

El vídeo incluido es un ejemplo público de NASM. Los enlaces privados reales deben sustituirse por los del entrenador y requieren permisos de YouTube para cada cliente. No se incrusta ningún vídeo.

## Comprobación pendiente en Figma

El código se comprueba sintácticamente. Al ejecutarlo en Figma, revisa el resultado a escala 100 %, el desplazamiento, las fuentes disponibles, las conexiones y las variantes antes de entregarlo como diseño final. Esta limitación se indica de forma explícita para evitar confundir el kit con un archivo Figma ya generado y comprobado.
