// src/widgets/texto/schema.ts

export const textoSchema = [
  {
    campo: "contenido",
    etiqueta: "Contenido",
    tipo: "expresion",        // acepta texto plano o {{variable}}
    placeholder: "Escribe algo o usa {{variable}}",
  },
  {
    campo: "variante",
    etiqueta: "Tamaño",
    tipo: "selector",
    opciones: [
      { valor: "h1", etiqueta: "Título 1" },
      { valor: "h2", etiqueta: "Título 2" },
      { valor: "h3", etiqueta: "Título 3" },
      { valor: "p",  etiqueta: "Párrafo" },
    ],
  },
  {
    campo: "alineacion",
    etiqueta: "Alineación",
    tipo: "alineacion",       // el panel renderiza botones izq/centro/der
  },
  {
    campo: "color",
    etiqueta: "Color",
    tipo: "selector",
    opciones: [
      { valor: "default",  etiqueta: "Normal" },
      { valor: "muted",    etiqueta: "Suave" },
      { valor: "primary",  etiqueta: "Primario" },
      { valor: "danger",   etiqueta: "Peligro" },
    ],
  },
] as const