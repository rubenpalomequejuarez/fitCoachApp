import type { AppData, Meal } from "./types";
import { demoSessions } from "./domain";
export const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const FULL_DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
export const MEAL_TYPES = [
  "Desayuno",
  "Media mañana",
  "Comida",
  "Merienda",
  "Cena",
];
export const imagePath = (name: string) => `/assets/${name}`;
export const meals: Meal[] = [
  {
    id: "m1",
    type: "Desayuno",
    name: "Avena con frutos rojos",
    kcal: 420,
    summary: "Avena · yogur natural · frutos rojos",
    image: "oats.jpg",
    ingredients: [
      { name: "Copos de avena", quantity: "60 g" },
      { name: "Yogur natural", quantity: "125 g" },
      { name: "Frutos rojos", quantity: "80 g" },
      { name: "Semillas de chía", quantity: "10 g" },
      { name: "Bebida de almendras", quantity: "100 ml" },
    ],
    recipe:
      "Mezcla la avena, la bebida de almendras y las semillas de chía en un bol.\nDéjalo reposar en la nevera durante la noche, o al menos 4 horas.\nAñade el yogur y los frutos rojos justo antes de servir.",
    notes:
      "Puedes dejarlo preparado la noche anterior. Come con calma y adapta la textura añadiendo un poco más de bebida vegetal.",
  },
  {
    id: "m2",
    type: "Media mañana",
    name: "Yogur, pera y nueces",
    kcal: 210,
    summary: "Yogur natural · pera · nueces",
    image: "yogurt.jpg",
    ingredients: [
      { name: "Yogur natural", quantity: "125 g" },
      { name: "Pera", quantity: "150 g" },
      { name: "Nueces", quantity: "15 g" },
    ],
    recipe:
      "Lava la pera y córtala en trozos.\nSírvela con el yogur y las nueces troceadas.",
    notes:
      "Si sales de casa, lleva la fruta y las nueces aparte. El yogur debe conservarse frío.",
  },
  {
    id: "m3",
    type: "Comida",
    name: "Bowl mediterráneo de quinoa",
    kcal: 560,
    summary: "Quinoa · garbanzos · verduras · tahini",
    image: "bowl.jpg",
    ingredients: [
      { name: "Quinoa en seco", quantity: "70 g" },
      { name: "Garbanzos cocidos", quantity: "100 g" },
      { name: "Tomate y pepino", quantity: "150 g" },
      { name: "Aceite de oliva", quantity: "10 g" },
      { name: "Tahini", quantity: "10 g" },
    ],
    recipe:
      "Enjuaga la quinoa y cuécela según las indicaciones del envase.\nLava y corta las verduras. Escurre los garbanzos.\nColoca todo en un bol y aliña con aceite de oliva, tahini y unas gotas de limón.",
    notes:
      "Puedes cambiar la quinoa por arroz integral manteniendo la misma cantidad en seco.",
  },
  {
    id: "m4",
    type: "Merienda",
    name: "Tostada de aguacate",
    kcal: 260,
    summary: "Pan integral · aguacate · semillas",
    image: "toast.jpg",
    ingredients: [
      { name: "Pan integral", quantity: "50 g" },
      { name: "Aguacate", quantity: "60 g" },
      { name: "Semillas variadas", quantity: "5 g" },
    ],
    recipe:
      "Tuesta el pan a tu gusto.\nMachaca el aguacate, extiéndelo sobre el pan y añade las semillas.",
    notes:
      "Añade un toque de limón para que el aguacate conserve mejor su color.",
  },
  {
    id: "m5",
    type: "Cena",
    name: "Salmón con verduras al horno",
    kcal: 450,
    summary: "Salmón · boniato · verduras de temporada",
    image: "salmon.jpg",
    ingredients: [
      { name: "Salmón", quantity: "150 g" },
      { name: "Boniato", quantity: "150 g" },
      { name: "Calabacín y zanahoria", quantity: "200 g" },
      { name: "Aceite de oliva", quantity: "5 g" },
    ],
    recipe:
      "Precalienta el horno a 190 °C.\nCorta el boniato y las verduras. Añade el aceite y hornea 20 minutos.\nIncorpora el salmón y cocina 12–15 minutos más, hasta que esté hecho.",
    notes:
      "Cambia las verduras por las que tengas en casa. Prioriza la comodidad y la constancia.",
  },
];
const diets = () =>
  Object.fromEntries(
    DAYS.map((_, i) => [
      i,
      meals.map((m) => ({
        ...m,
        id: `${i}-${m.id}`,
        ingredients: m.ingredients.map((x) => ({ ...x })),
        name:
          i === 1 && m.type === "Comida"
            ? "Ensalada templada de garbanzos"
            : i === 3 && m.type === "Desayuno"
              ? "Porridge de avena y frutos rojos"
              : m.name,
      })),
    ]),
  );
export const initialData: AppData = {
  clients: [
    {
      id: "ana",
      name: "Ana García",
      email: "ana@fitcoach.demo",
      goal: "Ganar fuerza y sentirme bien",
      initials: "AG",
      tone: "olive",
      joined: "Desde septiembre de 2026",
      diets: diets(),
      exerciseIds: ["e1", "e2", "e3", "e4", "e5", "e6"],
    },
    {
      id: "marcos",
      name: "Marcos Ruiz",
      email: "marcos@fitcoach.demo",
      goal: "Mejorar mi condición física",
      initials: "MR",
      tone: "clay",
      joined: "Desde octubre de 2026",
      diets: diets(),
      exerciseIds: ["e2", "e3", "e5"],
    },
    {
      id: "elena",
      name: "Elena Martín",
      email: "elena@fitcoach.demo",
      goal: "Construir hábitos saludables",
      initials: "EM",
      tone: "sand",
      joined: "Desde septiembre de 2026",
      diets: diets(),
      exerciseIds: ["e1", "e4", "e6"],
    },
    {
      id: "leo",
      name: "Leo Fernández",
      email: "leo@fitcoach.demo",
      goal: "Empezar a entrenar con constancia",
      initials: "LF",
      tone: "olive",
      joined: "Nuevo cliente",
      diets: {},
      exerciseIds: [],
    },
  ],
  exercises: [
    {
      id: "e1",
      name: "Sentadilla goblet",
      sets: 3,
      reps: "12",
      rest: 90,
      day: 0,
      notes:
        "Baja con control y mantén el peso cerca del pecho. Busca un recorrido cómodo.",
      technique:
        "Coloca los pies a la anchura de los hombros. Sujeta una mancuerna frente al pecho. Flexiona las caderas y rodillas sin perder la posición de la espalda. Empuja el suelo para volver a subir.",
      resource: "video",
      image: "squat.svg",
      url: "https://www.youtube.com/watch?v=nfX7IFK9UNI",
      group: "Pierna y glúteo",
    },
    {
      id: "e2",
      name: "Peso muerto rumano",
      sets: 3,
      reps: "10",
      rest: 90,
      day: 0,
      notes: "Lleva la cadera hacia atrás y evita redondear la espalda.",
      technique:
        "Sujeta las mancuernas junto a los muslos. Con las rodillas ligeramente flexionadas, lleva la cadera atrás y baja las pesas cerca de las piernas. Regresa contrayendo los glúteos.",
      resource: "image",
      image: "deadlift.svg",
      url: "",
      group: "Pierna y glúteo",
    },
    {
      id: "e3",
      name: "Puente de glúteos",
      sets: 4,
      reps: "12",
      rest: 60,
      day: 0,
      notes: "Haz una pausa de un segundo arriba. Mantén el abdomen activo.",
      technique:
        "Túmbate boca arriba con las rodillas flexionadas y los pies apoyados. Eleva las caderas sin arquear la zona lumbar. Desciende lentamente.",
      resource: "image",
      image: "bridge.svg",
      url: "",
      group: "Pierna y glúteo",
    },
    {
      id: "e4",
      name: "Remo con mancuerna",
      sets: 3,
      reps: "12 por lado",
      rest: 60,
      day: 2,
      notes: "Piensa en llevar el codo hacia tu cadera.",
      technique:
        "Apoya una mano y una rodilla sobre un banco estable. Mantén la espalda alineada y lleva la mancuerna hacia la cadera. Baja con control.",
      resource: "image",
      image: "row.svg",
      url: "",
      group: "Tren superior",
    },
    {
      id: "e5",
      name: "Press de hombros",
      sets: 3,
      reps: "10",
      rest: 75,
      day: 2,
      notes: "Evita encoger los hombros o arquear la espalda.",
      technique:
        "Coloca las mancuernas a la altura de los hombros. Eleva los brazos de forma controlada y vuelve a la posición inicial.",
      resource: "image",
      image: "press.svg",
      url: "",
      group: "Tren superior",
    },
    {
      id: "e6",
      name: "Plancha abdominal",
      sets: 3,
      reps: "30 segundos",
      rest: 45,
      day: 4,
      notes:
        "Respira con normalidad y mantén una línea entre hombros, cadera y tobillos.",
      technique:
        "Apoya antebrazos y puntas de los pies. Activa abdomen y glúteos y mantén el cuerpo alineado, sin hundir la zona lumbar.",
      resource: "image",
      image: "plank.svg",
      url: "",
      group: "Core y movilidad",
    },
  ],
  completed: {},
  mealLibrary: meals.map((m) => ({
    ...structuredClone(m),
    id: `dish-${m.id}`,
  })),
  routines: [],
  sessionLogs: [],
  schemaVersion: 2,
};
initialData.routines = [
  {
    id: "routine-leg",
    name: "Pierna y glúteo",
    exercises: structuredClone(
      initialData.exercises.filter((e) => e.day === 0),
    ),
  },
  {
    id: "routine-upper",
    name: "Tren superior",
    exercises: structuredClone(
      initialData.exercises.filter((e) => e.day === 2),
    ),
  },
];
initialData.sessionLogs = demoSessions(initialData.clients);
export const youtubeId = (value: string) => {
  try {
    const u = new URL(value);
    if (!["https:", "http:"].includes(u.protocol)) return null;
    const host = u.hostname.replace(/^www\./, "");
    let id = "";
    if (host === "youtu.be") id = u.pathname.split("/")[1];
    else if (host === "youtube.com" || host === "m.youtube.com")
      id =
        u.searchParams.get("v") ||
        u.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1] ||
        "";
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
};
