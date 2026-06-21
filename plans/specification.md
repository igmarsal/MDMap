# Arquitectura para herramienta propia de mapas mentales (local-first, basada en Markdown)

Para un enfoque totalmente visual, sin fricción y 100% centrado en la privacidad local y digital, desarrollar tu propia herramienta ligera de mapas mentales es una idea fantástica. Al ser tú el dueño del código, puedes controlar exactamente cómo se guarda y cómo lo lee la IA.

Si el objetivo es una aplicación sencilla, rápida, que funcione en local y donde la propia base de datos sea el archivo `.md`, la arquitectura ideal prescinde de bases de datos pesadas y se apoya en tecnologías web modernas y eficientes.

A continuación, la pila tecnológica (stack) recomendada para construirla.

## 1. El núcleo visual (el motor del diagrama)

Para la interfaz del mapa mental, no conviene reinventar la rueda desde cero; lo mejor es usar una librería de diagramación interactiva que gestione los nodos, las líneas y el "arrastrar y soltar":

- **React Flow** (o **Svelte Flow** si se prefiere un framework ultra-ligero). Es, con diferencia, la mejor librería moderna para crear interfaces de nodos y mapas mentales. Es altamente personalizable, soporta zoom, paneo, selección múltiple y es extremadamente rápida.
- **Alternativa más tradicional:** GoJS o Cytoscape.js, aunque React Flow ofrece una experiencia de usuario mucho más pulida y moderna ("vibe" de herramienta SaaS actual) con menos código.

## 2. El frontend (la interfaz de usuario)

- **Framework:** Next.js (App Router) o Vite + React.
- **Estilos:** Tailwind CSS combinado con Shadcn/ui. Permite maquetar una interfaz limpia, oscura (modo dark por defecto) y minimalista en tiempo récord.

## 3. El backend y entorno (soberanía local y archivos)

Como el "backend" y la "base de datos" deben ser el propio archivo Markdown, no se necesita un servidor Node.js/Express tradicional corriendo en la nube. Hay dos opciones para trabajar directamente con el sistema de archivos local:

### Opción A — Aplicación de escritorio con Tauri
**Tauri + Rust.** En lugar de Electron (que consume demasiada memoria), Tauri permite empaquetar el frontend web en una app nativa ultra-ligera (pocos megabytes). Desde el frontend se pueden llamar funciones de Rust nativas para leer y escribir directamente los archivos `.md` en las carpetas de los proyectos de VS Code.

### Opción B — Web pura con File System Access API
Se puede construir una SPA (Single Page Application) normal que use la API nativa de los navegadores modernos (`window.showOpenFilePicker`). Esto permite que el usuario abra una carpeta local de su ordenador desde el navegador, y la web puede leer y guardar el archivo Markdown directamente ahí sin necesidad de instalar nada.

## 4. La "base de datos" y lógica de conversión

Dado que la persistencia es el propio `.md`, la lógica de la aplicación se reduce a dos funciones JavaScript que actúan como "puente":

- **Función Parser (de MD a nodos visuales):** al abrir la app, lee el archivo Markdown, cuenta las tabulaciones o los marcadores de lista (`#`, `-`, etc.) y calcula las posiciones X e Y para pintar los nodos en React Flow.
- **Función Compiler (de nodos visuales a MD):** cada vez que se añade un nodo o se modifica un texto de forma visual, la app recorre el árbol de nodos, genera el texto estructurado en Markdown y lo sobreescribe en el archivo de forma automática.

## Flujo de trabajo ideal para programar con IA

Una vez construida la herramienta (por ejemplo, *Zima Maps* o *Stardust Planner*), el flujo diario sería el siguiente:

1. Abres tu herramienta visual y diseñas los módulos de tu nueva app (nodos, flujos, ideas).
2. La herramienta guarda automáticamente un archivo `mental_plan.md` en la raíz de tu proyecto.
3. Abres VS Code / Cursor. Tu extensión de IA lee el contexto de ese `mental_plan.md` (que se actualiza en tiempo real cada vez que mueves algo en tu mapa visual).
4. Le pides a la IA que genere el código basándose en los cambios visuales que acabas de hacer.

---

*Posible siguiente paso: profundizar en cómo estructurar el estado de React Flow para que la conversión a Markdown bidireccional sea lo más limpia posible.*