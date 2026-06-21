# Manual de usuario de MDMap

## Qué es MDMap

MDMap es una aplicación para crear mapas mentales visuales y guardarlos como archivos Markdown. Está pensada para organizar ideas, planes, tareas, apuntes o cualquier estructura jerárquica.

## Abrir la aplicación

### Modo desarrollo

Ejecuta:

```bash
npm run dev
```

Después abre:

```text
http://localhost:5173
```

### Modo compilado

Ejecuta:

```bash
npm run build
npm run preview
```

La vista previa se abre normalmente en:

```text
http://127.0.0.1:4173
```

También puedes usar el script de arranque de la carpeta `scripts/`.

## Interfaz principal

La pantalla se divide en estas zonas:

- Barra superior: permite abrir, guardar y ver el archivo activo.
- Barra de herramientas: permite añadir nodos, copiar, pegar y borrar.
- Lienzo central: muestra los nodos y las conexiones del mapa mental.
- Minimapa y controles de zoom: ayudan a moverse por mapas grandes.

## Crear un mapa

Al iniciar la aplicación aparece un mapa inicial con una idea central y dos ramas.

Para crear un nodo raíz:

1. Pulsa **Raíz** en la barra de herramientas.
2. Se creará un nuevo nodo independiente.

Para crear un hijo de un nodo:

1. Selecciona el nodo padre.
2. Pulsa **Hijo** en la barra de herramientas.
3. También puedes pulsar el botón `+` que aparece sobre el nodo seleccionado.

## Editar nodos

Para editar un nodo:

1. Haz doble clic sobre el nodo.
2. Escribe el texto.
3. Añade etiquetas si las necesitas.
4. Pulsa **Aceptar** o usa `Ctrl + Enter` / `Cmd + Enter`.

Para cancelar la edición, pulsa **Cancelar** o `Escape`.

Si el texto queda vacío, la edición se cancela y el nodo no se guarda.

## Etiquetas

Las etiquetas se escriben separadas por coma en el campo de edición del nodo.

Ejemplos:

```text
central, importante, urgente
```

También puedes escribirlas directamente en Markdown usando `#`:

```markdown
- Tarea importante #importante #urgente
```

Etiquetas disponibles por defecto:

- `central`
- `importante`
- `urgente`
- `idea`
- `hecho`
- `pregunta`
- `decision`

Si una etiqueta no coincide con una de estas, se muestra con un color genérico.

## Seleccionar, mover y conectar

Para seleccionar un nodo, haz clic sobre él.

Para mover un nodo, arrástralo dentro del lienzo.

Para conectar nodos manualmente:

1. Selecciona el nodo origen.
2. Arrastra desde su conector hasta el nodo destino.
3. Se creará una conexión.

## Copiar y pegar

Para copiar un nodo:

1. Selecciona el nodo.
2. Pulsa **Copiar** o `Ctrl + C` / `Cmd + C`.

La copia incluye el nodo seleccionado y todos sus descendientes.

Para pegar:

1. Pulsa **Pegar** o `Ctrl + V` / `Cmd + V`.
2. El bloque copiado aparecerá desplazado ligeramente respecto a la posición original.

## Borrar nodos

Para borrar un nodo:

1. Selecciona el nodo.
2. Pulsa **Borrar** o la tecla `Delete`.

Si el nodo tiene descendientes, la aplicación pedirá confirmación antes de eliminar toda la rama.

## Abrir archivos Markdown

Pulsa **Abrir .md** en la barra superior.

En navegadores compatibles se abrirá el selector de archivos del sistema. En otros navegadores se usará un selector de archivo tradicional.

La aplicación acepta archivos con extensión `.md`.

## Abrir desde carpeta

Pulsa **Abrir carpeta** para elegir una carpeta. La aplicación intentará abrir o crear un archivo llamado:

```text
mdmap_plan.md
```

Si la carpeta ya contiene ese archivo, se cargará su contenido.

## Guardar

Pulsa **Guardar** en la barra superior.

Si el navegador permite acceso directo al sistema de archivos, MDMap guarda el archivo en la ubicación seleccionada. Si no lo permite, descargará un archivo `.md`.

El autoguardado también intenta guardar cambios después de unos segundos.

## Atajos de teclado

| Acción | Atajo |
|---|---|
| Guardar | `Ctrl + S` / `Cmd + S` |
| Copiar | `Ctrl + C` / `Cmd + C` |
| Pegar | `Ctrl + V` / `Cmd + V` |
| Borrar nodo seleccionado | `Delete` |
| Aceptar edición | `Ctrl + Enter` / `Cmd + Enter` |
| Cancelar edición | `Escape` |

## Formato Markdown

MDMap guarda los mapas como listas indentadas.

Ejemplo:

```markdown
- Idea central #central
  - Rama 1 #idea
  - Rama 2
    - Subrama 1
```

Reglas útiles:

- Cada línea que empieza con `-` crea un nodo.
- La indentación determina el nivel.
- Se recomiendan 2 espacios por nivel.
- Las etiquetas se escriben con `#`.
- Las líneas de continuación empiezan con `|`.

Ejemplo con continuación:

```markdown
- Idea central
  | Detalle adicional
  | Otro detalle
  - Rama 1
```

## Consejos

- Usa una sola idea central cuando el mapa sea pequeño.
- Usa varios nodos raíz cuando necesites separar temas.
- Usa etiquetas para identificar tareas, preguntas o decisiones.
- Guarda el archivo con frecuencia si el navegador no permite acceso directo al sistema de archivos.
