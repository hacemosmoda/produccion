# Access Busints → JSON Estructurado

Aplicación web profesional Access Busints para convertir datos a formato JSON estructurado, con soporte para múltiples formatos de entrada.

## 🚀 Características

- **Detección automática de formato**: Soporta dos formatos de headers (Confección 26 cols / Procesos 17 cols)
- **Validación estricta**: Los headers deben coincidir EXACTAMENTE con uno de los formatos
- **Mapeo inteligente**: Convierte automáticamente al formato JSON requerido
- **Vista previa interactiva**: Tabla con búsqueda, ordenamiento y paginación
- **Exportación flexible**: Descarga o copia el JSON generado
- **Arquitectura modular**: Código organizado y mantenible

## 📁 Estructura del Proyecto

```
access-busints/
├── index.html                 # Punto de entrada HTML
├── assets/
│   └── css/
│       ├── reset.css         # Reset de estilos
│       ├── variables.css     # Variables CSS (tokens de diseño)
│       ├── layout.css        # Estilos de layout
│       └── components.css    # Estilos de componentes
├── src/
│   ├── main.js              # Punto de entrada de la aplicación
│   ├── config/
│   │   └── headerSets.js    # Configuración de conjuntos de headers
│   ├── core/
│   │   ├── DOMManager.js    # Gestión centralizada del DOM
│   │   └── EventHandler.js  # Gestión de eventos
│   ├── controllers/
│   │   └── UIController.js  # Controlador de UI
│   ├── services/
│   │   ├── DataProcessor.js # Orquestador de procesamiento
│   │   ├── DataParser.js    # Parseo de datos
│   │   ├── HeaderDetector.js # Detección de headers
│   │   └── DataMapper.js    # Mapeo de datos
│   └── utils/
│       └── TableRenderer.js # Renderizado de tablas
└── README.md
```

## 🏗️ Arquitectura

### Capas de la Aplicación

1. **Presentación** (`index.html`, `assets/css/`)
   - Estructura HTML semántica
   - Estilos modulares con CSS Variables
   - Diseño responsive

2. **Controladores** (`src/controllers/`)
   - `UIController`: Gestiona la interfaz de usuario

3. **Core** (`src/core/`)
   - `DOMManager`: Cacheo y acceso a elementos DOM
   - `EventHandler`: Registro y manejo de eventos

4. **Servicios** (`src/services/`)
   - `DataProcessor`: Orquestación del procesamiento
   - `DataParser`: Parseo de texto a matriz
   - `HeaderDetector`: Detección y validación de headers
   - `DataMapper`: Transformación de datos a JSON

5. **Utilidades** (`src/utils/`)
   - `TableRenderer`: Renderizado de tablas con Grid.js

6. **Configuración** (`src/config/`)
   - `headerSets.js`: Definición de formatos soportados

## 🎯 Patrones de Diseño Implementados

- **Separation of Concerns**: Cada módulo tiene una responsabilidad única
- **Dependency Injection**: Los componentes reciben sus dependencias
- **Module Pattern**: Uso de ES6 modules para encapsulación
- **Observer Pattern**: Sistema de eventos desacoplado
- **Strategy Pattern**: Diferentes estrategias de mapeo según el tipo

## 🛠️ Tecnologías

- **Vanilla JavaScript** (ES6+)
- **CSS3** con Custom Properties
- **Grid.js** para tablas interactivas
- **Font Awesome** para iconos

## 📖 Uso

1. Abrir `index.html` en un navegador moderno
2. Pegar datos (primera fila = headers)
3. Hacer clic en "Procesar y Mapear"
4. Descargar o copiar el JSON generado

## 🔧 Formatos Soportados

### Formato Confección (26 columnas - EXACTAS)
```
Ubicacion, Nombre, Numlote, Marca, Ref, desclarga, Col, RefExt, Total, 
FechaSalda, FechaEntrada, Nombre2, Telefono, Celular, Direccion, Ciudad, 
Encargado, NumPed, FechaDespacho, Cuento, Obs Salida, Costo Conf+Term, 
Valor a Pagar, Inv Muestras, Linea, Categoria de Producto
```

### Formato Procesos (17 columnas - EXACTAS)
```
Coleccion, Ref, RefExt, NumLote, emp, Total, Vt, Planta, Proceso, doc, 
Obs, FechaSal, FechaEntrega, Cuento, Categoria, Linea, Cant Minutos
```

**⚠️ IMPORTANTE**: La validación es ESTRICTA. Deben estar TODAS las columnas en el orden correcto, sin columnas extra ni faltantes.

## 🚦 Flujo de Datos

```
Usuario pega datos
    ↓
DataParser → Parsea texto a matriz
    ↓
HeaderDetector → Detecta tipo de formato
    ↓
HeaderDetector → Valida headers requeridos
    ↓
DataMapper → Mapea a formato JSON
    ↓
UIController → Muestra resultados
```

## 🎨 Sistema de Diseño

El proyecto utiliza CSS Variables para mantener consistencia:

- **Colores**: Paleta semántica (primary, success, warning, danger)
- **Espaciado**: Sistema de spacing consistente
- **Tipografía**: Escalas de tamaño y peso
- **Bordes**: Radios estandarizados
- **Sombras**: Niveles de elevación

## 📝 Extensibilidad

Para agregar un nuevo formato:

1. Agregar headers en `src/config/headerSets.js`
2. Actualizar lógica de detección en `HeaderDetector.js`
3. Crear función de mapeo en `DataMapper.js`

## 🔒 Mejores Prácticas

- ✅ Código modular y reutilizable
- ✅ Separación de responsabilidades
- ✅ Manejo de errores robusto
- ✅ Comentarios JSDoc
- ✅ Nombres descriptivos
- ✅ Constantes configurables
- ✅ Sin dependencias innecesarias

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.
