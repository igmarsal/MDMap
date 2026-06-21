# Manual de administrador de MDMap

## Visión general

MDMap es una aplicación frontend construida con React, TypeScript, Vite, React Flow y Tailwind CSS. No requiere servidor backend para funcionar en modo local. La persistencia se realiza mediante archivos Markdown abiertos desde el navegador.

## Requisitos del entorno

- Node.js 20 o superior
- npm
- Navegador moderno basado en Chromium para acceso completo a archivos locales

Navegadores recomendados:

- Google Chrome
- Microsoft Edge
- Brave
- Chromium

La API de acceso al sistema de archivos permite abrir y guardar archivos directamente. En navegadores no compatibles, la aplicación usa descarga de archivos como alternativa.

## Instalación

Desde la carpeta principal del proyecto:

```bash
npm install
```

El archivo `package-lock.json` fija las versiones instaladas. Se recomienda usarlo para mantener consistencia entre equipos.

## Comandos disponibles

```bash
npm run dev
npm run build
npm run preview
```

### Desarrollo

```bash
npm run dev
```

Inicia Vite en modo desarrollo con recarga automática.

### Compilación

```bash
npm run build
```

Ejecuta TypeScript y genera la aplicación en la carpeta `dist`.

### Vista previa

```bash
npm run preview
```

Sirve la carpeta `dist` en modo local.

## Script multiplataforma

En la carpeta `scripts/` se incluyen ejecutables para compilar la aplicación, generar un ZIP portable y abrirla en el navegador:

| Sistema | Archivo |
|---|---|
| Windows | `scripts/compilar-aplicacion.bat` |
| macOS | `scripts/compilar-aplicacion.command` |
| Linux | `scripts/compilar-aplicacion.sh` |

El flujo del script es:

1. Comprueba que Node.js y npm estén disponibles.
2. Ejecuta `npm install` si falta `node_modules`.
3. Ejecuta `npm run build`.
4. Genera un ZIP portable en `release/MDMap-<fecha>.zip`.
5. Inicia `npm run preview -- --host 127.0.0.1 --port 4173`.
6. Abre `http://127.0.0.1:4173` en el navegador predeterminado.

## Permisos de ejecución

En macOS y Linux puede ser necesario dar permiso de ejecución:

```bash
chmod +x scripts/compilar-aplicacion.sh
chmod +x scripts/compilar-aplicacion.command
```

## Estructura del proyecto

```text
src/
  App.tsx                         Estado principal del mapa
  components/
    FileBar.tsx                   Barra de apertura y guardado
    MarkdownEditor/               Editor y vista previa Markdown
    mindmap/                      Lienzo, nodos, bordes y toolbar
  hooks/                          Atajos de teclado y autoguardado
  lib/
    compiler/nodesToMd.ts         Conversión de nodos a Markdown
    fileSystem/useFileSystem.ts   Acceso a archivos locales
    parser/mdToNodes.ts           Conversión de Markdown a nodos
  stores/useMindMapStore.tsx      Contexto de estado
  main.tsx                        Punto de entrada
  index.css                       Estilos y tema Tailwind
```

## Archivos críticos

### `src/App.tsx`

Coordina el estado del mapa:

- Nodos y conexiones.
- Archivo activo.
- Estado de cambios sin guardar.
- Apertura y guardado.
- Copiar, pegar, añadir y eliminar nodos.
- Conversión entre nodos y Markdown.

### `src/lib/parser/mdToNodes.ts`

Convierte Markdown indentado en nodos del mapa mental.

Funciones principales:

- `parseIndentation`
- `parseTags`
- `mdToNodes`
- `calculateLayout`

### `src/lib/compiler/nodesToMd.ts`

Convierte nodos del mapa mental en Markdown.

Funciones principales:

- `formatNodeText`
- `nodesToMd`

### `src/lib/fileSystem/useFileSystem.ts`

Gestiona la apertura y guardado de archivos.

Funciones principales:

- `openFile`
- `saveFile`
- `openDirectory`
- `fallbackOpen`

## Criterios de aceptación para nuevas versiones

Antes de entregar una versión:

1. Ejecutar `npm install`.
2. Ejecutar `npm run build`.
3. Abrir la aplicación en un navegador moderno.
4. Crear un mapa con nodos, etiquetas y ramas.
5. Guardar en `.md`.
6. Recargar la aplicación.
7. Abrir el archivo `.md` guardado.
8. Confirmar que el mapa se reconstruye correctamente.
9. Comprobar copiar, pegar y borrar una rama.

## Despliegue estático

Como la aplicación es estática, puede publicarse en cualquier hosting que sirva archivos estáticos.

Ejemplo de publicación:

```bash
npm run build
```

Subir el contenido de la carpeta `dist` al servidor.

## Limitaciones conocidas

- El acceso directo a archivos requiere navegadores compatibles con File System Access API.
- En navegadores no compatibles, la apertura usa selector de archivo y el guardado usa descarga.
- No existe autenticación de usuarios.
- No existe sincronización en la nube.
- Los archivos se guardan localmente en Markdown.

## Mantenimiento

Actualizaciones de dependencias:

```bash
npm update
npm install
npm run build
```

Después de actualizar dependencias, comprobar manualmente:

- Arranque de desarrollo.
- Compilación de producción.
- Apertura de Markdown.
- Guardado de Markdown.
- Funcionamiento de React Flow.

## Solución de problemas

### Fallo en `npm install`

Eliminar dependencias instaladas y volver a instalar:

```bash
rm -rf node_modules package-lock.json
npm install
```

En Windows, usar PowerShell o eliminar manualmente la carpeta `node_modules`.

### Fallo en compilación

Ejecutar:

```bash
npm run build
```

Revisar errores de TypeScript y corregir el archivo indicado.

### La aplicación no guarda en la misma ruta

Comprobar que el navegador sea compatible con File System Access API y que el usuario conceda permiso de escritura.

### El archivo Markdown no se interpreta correctamente

Revisar que el formato use listas indentadas:

```markdown
- Idea central
  - Rama 1
  - Rama 2
```

Cada nodo debe empezar con `-` y la indentación debe usar espacios, preferiblemente de dos en dos.
