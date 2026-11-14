export type Role = "client" | "trainer";
export type Ingredient = { name: string; quantity: string };
export type Meal = {
  id: string;
  type: string;
  name: string;
  kcal: number;
  summary: string;
  image: string;
  ingredients: Ingredient[];
  recipe: string;
  notes: string;
};
export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: number;
  day: number;
  notes: string;
  technique: string;
  resource: "image" | "video";
  image: string;
  url: string;
  group: string;
};
export type Client = {
  id: string;
  name: string;
  email: string;
  goal: string;
  initials: string;
  tone: string;
  joined: string;
  diets: Record<number, Meal[]>;
  exerciseIds: string[];
};
export type AppData = {
  clients: Client[];
  exercises: Exercise[];
  completed: Record<string, boolean>;
};
