# MDMap - Mapas Mentales Interactivos

> Herramienta de mapas mentales basada en Markdown con múltiples modos de visualización

MDMap es una aplicación web moderna para crear, visualizar y gestionar mapas mentales. Permite trabajar con documentos Markdown existentes de manera visual, con soporte para múltiples modos de disposición, filtros avanzados y una experiencia de usuario optimizada.

## 🚀 Características

### Visualización Avanzada

- **3 modos de layout**:
  - **Horizontal** (predeterminado): Crece principalmente en vertical, ideal para mapas grandes
  - **Vertical**: Diseño tradicional mejorado y más compacto
  - **Radial**: Disposición circular para mapas equilibrados y exploratorios
- **Espaciado dinámico**: Los tres modos de layout ajustan automáticamente el espaciado según la altura real de cada nodo (cuerpo visible vs. oculto)
- **Nodos de ancho fijo**: Ancho máximo controlado (240px) con texto que hace wrap automáticamente
- **Colapso de ramas**: Plegar/desplegar ramas para reducir ruido visual en mapas grandes, con indicador de descendientes ocultos
- **Reorganización automática**: Ocultar/mostrar ramas completadas o aplicar filtros recalcula el layout completo
- **Movimiento manual con persistencia**: Las posiciones de nodos arrastrados se guardan en `localStorage` y se restauran al recargar
- **Panel de índice**: Navegación jerárquica como árbol textual con búsqueda y selección de nodos

### Gestión de Contenido

- **Edición directa**: Doble clic en cualquier nodo para editar título, cuerpo, etiquetas y estado
- **Título y cuerpo separados**: Primera línea como título, resto como cuerpo del nodo
- **Etiquetas**: Soporte para etiquetas tipo `#importante`, `#central`, etc. Cada etiqueta se muestra con un color único generado automáticamente
- **Estado tri-estado**: Cada nodo puede estar **Pendiente** (⬜), **En curso** (🟡) o **Completado** (✅). Se alterna con un botón cíclico en el editor
- **Autocompletado de padres**: Cuando todos los hijos de un nodo están completados, el padre se marca automáticamente como Completado
- **Estado de raíz automático**: El estado de los nodos raíz se calcula automáticamente a partir de sus descendientes
- **Auto-ocultación de completadas**: Opción para ocultar ramas completadas (no afecta a nodos "En curso")

### Operaciones

- **Undo/Redo completo**: Deshacer y rehacer con `Ctrl+Z`/`Ctrl+Y` o botones en la toolbar (historial de 100 entradas)
- **Navegación por teclado**: Atajos para crear hijos (`Tab`), hermanos (`Shift+Tab`), guardar (`Ctrl+S`)
- **Copiar y pegar**: `Ctrl+C`/`Ctrl+V` para duplicar nodos y subárboles
- **Selección múltiple**: `Shift+Click` para seleccionar varios nodos
- **Borrar**: `Delete` para eliminar nodos y descendientes (`Backspace` no borra nodos, funciona normal en campos de texto)
- **Filtros avanzados**: Filtrar por texto, etiquetas y niveles. Las opciones de filtro permanecen visibles aunque los nodos estén ocultos

### Importación/Exportación

- **Markdown como fuente de verdad**: Compatible con documentos Markdown estándar
- **Sintaxis extendida**: Soporte para `- Título | cuerpo`, `[ ]`/`[~]`/`[x]` (estado tri-estado), `#tag`
- **Exportación PNG**: Exportar la vista actual con fondo blanco
- **File System Access API**: Guardar directamente en Chrome/Edge (en otros navegadores se descarga una copia)

### Internacionalización

- **Idiomas**: Español e inglés con cambio instantáneo
- **Persistencia**: El idioma seleccionado se guarda entre sesiones

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/usuario/mdmap.git
cd mdmap

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```

## 🎯 Uso Rápido

1. **Crear mapa**: Escribe o abre un documento Markdown
2. **Añadir nodos**: `Tab` (hijo), `Shift+Tab` (hermano), o usa la toolbar
3. **Editar**: Doble clic en cualquier nodo
4. **Cambiar layout**: Usa los botones de layout en la toolbar
5. **Plegar ramas**: Click en el chevron al lado de nodos con hijos
6. **Filtrar**: Usa el panel de filtros para buscar por texto o etiquetas
7. **Guardar**: `Ctrl+S` o usa el botón de guardar

## 📝 Sintaxis Markdown

### Estructura Básica

```markdown
- Idea central
  - Rama 1
    - Sub-rama 1.1
  - Rama 2
```

### Cuerpo del Nodo

```markdown
- Título del nodo
  | Primera línea del cuerpo
  | Segunda línea del cuerpo
```

### Estado del Nodo

Cada nodo puede tener uno de tres estados:

| Símbolo | Sintaxis | Estado |
|---------|----------|--------|
| ⬜ | `[ ]` | Pendiente |
| 🟡 | `[~]` | En curso |
| ✅ | `[x]` | Completado |

```markdown
- [ ] Tarea pendiente
- [~] Tarea en progreso
- [x] Tarea completada
```

### Etiquetas

```markdown
- Idea importante #central #urgente
```

### Frontmatter YAML (ignorado)

```markdown
---
title: Mi Mapa
tags: personal
---

- Contenido del mapa
```

## 🎨 Modos de Layout

### Horizontal (Predeterminado)

La raíz está a la izquierda, los hijos crecen hacia la derecha. El crecimiento principal es vertical, lo que lo hace ideal para mapas grandes.

```
[Raíz] ─── [Hijo 1] ─── [Nieto 1.1]
       │              └── [Nieto 1.2]
       └── [Hijo 2] ─── [Nieto 2.1]
                      └── [Nieto 2.2]
```

### Vertical

La raíz está arriba, los hijos crecen hacia abajo. Más compacto que el diseño tradicional.

```
        [Raíz]
       /       \
  [Hijo 1]   [Hijo 2]
   /   \          \
[N 1.1] [N 1.2]   [N 2.1]
```

### Radial

La raíz está en el centro, los hijos se distribuyen en radios concéntricos. Ideal para mapas equilibrados.

```
      [Nieto 1.1]
        /
   [Hijo 1]
       \
        [Nieto 1.2]

[Raíz]

   [Hijo 2] ─── [Nieto 2.1]
```

## ⌨️ Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Tab` | Añadir hijo al nodo seleccionado |
| `Shift+Tab` | Añadir hermano al nodo seleccionado |
| `Ctrl+S` / `Cmd+S` | Guardar |
| `Ctrl+Z` / `Cmd+Z` | Deshacer |
| `Ctrl+Y` / `Cmd+Y` | Rehacer |
| `Ctrl+C` / `Cmd+C` | Copiar nodos seleccionados |
| `Ctrl+V` / `Cmd+V` | Pegar nodos |
| `Delete` | Borrar nodos seleccionados (`Backspace` no borra nodos) |
| `Shift+Click` | Selección múltiple |
| `Escape` | Cancelar edición |

## 🧪 Tests

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

## 📄 Licencia

MIT - Ver archivo LICENSE para más detalles.

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 🗺️ Roadmap

- [ ] SVG export
- [ ] Drag and drop estructural
- [ ] Edición colaborativa
- [ ] Sincronización remota

## 📞 Soporte

Para preguntas, sugerencias o reporte de bugs, por favor abre un issue en GitHub.