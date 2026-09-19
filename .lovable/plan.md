# Aprovechar toda la altura del editor y la vista previa

## Objetivo

Eliminar el bloque vacío que aparece debajo del código y de la página, usando toda la altura disponible hasta la barra inferior donde se escriben los prompts.

## Cambios

- Reestructurar el área central con filas de altura estable: pestañas arriba y contenido con `minmax(0, 1fr)` debajo.
- Hacer que la pestaña activa, el editor de código y la vista previa hereden explícitamente el 100% de esa altura.
- Sobrescribir la altura interna predeterminada del visor para evitar que vuelva a limitarse aproximadamente a media pantalla.
- Mantener desplazamiento independiente en código y página, sin desplazar ni ocultar la barra inferior de prompts.
- Mantener el modo de pantalla completa y la consola opcional funcionando dentro del nuevo espacio.

## Verificación

- Abrir un proyecto con contenido largo y comprobar que código y página llegan visualmente hasta la barra de prompts.
- Recorrer ambos paneles hasta el final con sus propias barras de desplazamiento.
- Revisar las pestañas Código, Vista previa e Historial.
- Validar el resultado en escritorio y en una ventana de menor altura, comprobando que no haya recortes ni espacio vacío.

## Detalles técnicos

El ajuste se concentrará en la cadena de altura de `ProjectEditor`, el contenido activo de las pestañas y los contenedores internos de Sandpack. Se usará una cuadrícula con fila flexible y reglas explícitas de `height`, `min-height` y `flex` para que ningún contenedor conserve la altura predeterminada del visor.
