import { useId } from "react";
import { Plus, Trash2, BookOpen, Copy } from "lucide-react";
import { Field, TextArea } from "./ui";
import { MEAL_TYPES, meals } from "../data";
import type { Meal } from "../types";
export function MealEditorCard({
  meal,
  index = 0,
  onChange,
  onDelete,
  onDuplicate,
  onSaveToLibrary,
  errors = {},
}: {
  meal: Meal;
  index?: number;
  onChange: (patch: Partial<Meal>) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onSaveToLibrary?: () => void;
  errors?: Record<string, string>;
}) {
  const ingredientsErrorId = useId();
  return (
    <section
      className="meal-editor"
      data-meal-id={meal.id}
      aria-label={meal.name || meal.type}
    >
      <header>
        <span className="meal-number">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="field">
          <label htmlFor={`type-${meal.id}`}>Momento del día</label>
          <select
            id={`type-${meal.id}`}
            value={meal.type}
            onChange={(e) =>
              onChange({
                type: e.target.value,
                image:
                  meals.find((m) => m.type === e.target.value)?.image ||
                  "bowl.jpg",
              })
            }
          >
            {MEAL_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        {onDuplicate && (
          <button
            type="button"
            className="icon-button"
            aria-label={`Duplicar comida ${meal.name || meal.type}`}
            title="Duplicar comida"
            onClick={onDuplicate}
          >
            <Copy size={18} />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            className="icon-button delete-button"
            aria-label={`Eliminar ${meal.type}`}
            onClick={onDelete}
          >
            <Trash2 size={18} />
          </button>
        )}
      </header>
      <div className="meal-editor-fields">
        <Field
          label="Nombre del plato"
          placeholder="Ej. Avena con frutos rojos"
          value={meal.name}
          onChange={(e) => onChange({ name: e.target.value })}
          error={errors.name}
        />
        <Field
          label="Calorías (opcional)"
          type="number"
          min="0"
          value={meal.kcal || ""}
          placeholder="kcal"
          onChange={(e) => onChange({ kcal: +e.target.value })}
          error={errors.kcal}
        />
      </div>
      <div className="ingredients-editor">
        <div className="ingredients-label">
          <span>Alimentos</span>
          <span>Cantidad</span>
        </div>
        {meal.ingredients.map((x, i) => (
          <div className="ingredient-fields" key={i}>
            <input
              aria-label={`Alimento ${i + 1} de ${meal.type}`}
              aria-invalid={!!errors.ingredients && !x.name.trim()}
              aria-describedby={
                errors.ingredients && !x.name.trim() ? ingredientsErrorId : undefined
              }
              placeholder="Ej. Copos de avena"
              value={x.name}
              onChange={(e) =>
                onChange({
                  ingredients: meal.ingredients.map((v, j) =>
                    j === i ? { ...v, name: e.target.value } : v,
                  ),
                })
              }
            />
            <input
              aria-label={`Cantidad del alimento ${i + 1} de ${meal.type}`}
              aria-invalid={!!errors.ingredients && !x.quantity.trim()}
              aria-describedby={
                errors.ingredients && !x.quantity.trim() ? ingredientsErrorId : undefined
              }
              placeholder="60 g"
              value={x.quantity}
              onChange={(e) =>
                onChange({
                  ingredients: meal.ingredients.map((v, j) =>
                    j === i ? { ...v, quantity: e.target.value } : v,
                  ),
                })
              }
            />
            <button
              type="button"
              className="icon-button"
              aria-label={`Quitar alimento ${i + 1}`}
              onClick={() =>
                onChange({
                  ingredients: meal.ingredients.filter((_, j) => j !== i),
                })
              }
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {errors.ingredients && (
          <p className="error-text" role="alert" id={ingredientsErrorId}>
            {errors.ingredients}
          </p>
        )}
        <button
          type="button"
          className="text-link"
          aria-invalid={!!errors.ingredients && !meal.ingredients.length}
          aria-describedby={
            errors.ingredients && !meal.ingredients.length ? ingredientsErrorId : undefined
          }
          onClick={() =>
            onChange({
              ingredients: [...meal.ingredients, { name: "", quantity: "" }],
            })
          }
        >
          <Plus size={15} />
          Añadir alimento
        </button>
      </div>
      <TextArea
        label="Receta paso a paso"
        placeholder="Un paso por línea…"
        rows={3}
        value={meal.recipe}
        onChange={(e) => onChange({ recipe: e.target.value })}
        error={errors.recipe}
      />
      <TextArea
        label="Notas del entrenador (opcional)"
        placeholder="Alternativas, preparación o algún consejo…"
        rows={2}
        value={meal.notes}
        onChange={(e) => onChange({ notes: e.target.value })}
      />
      {onSaveToLibrary && (
        <button type="button" className="text-link" onClick={onSaveToLibrary}>
          <BookOpen size={15} />
          Guardar una copia en mi biblioteca
        </button>
      )}
    </section>
  );
}
