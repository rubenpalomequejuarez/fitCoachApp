// Datos de ejemplo para desarrollo y pruebas. Se crean con "npm run seed".
//
// Cuentas de prueba:
//   Entrenador: carlos@fitcoach.test / entrenador123
//   Clientes:   maria@fitcoach.test  / cliente123
//               javier@fitcoach.test / cliente123
//               lucia@fitcoach.test  / cliente123
//               pablo@fitcoach.test  / cliente123

export function seed({ uid, hashPassword }) {
  const mk = (role, name, email, password, extra = {}) => {
    const { salt, hash } = hashPassword(password);
    return { id: uid(), role, name, email, salt, hash, ...extra };
  };

  const trainer = mk('trainer', 'Carlos Ruiz', 'carlos@fitcoach.test', 'entrenador123');
  const maria = mk('client', 'María García', 'maria@fitcoach.test', 'cliente123', {
    goal: 'Pérdida de grasa', trainerId: trainer.id,
  });
  const javier = mk('client', 'Javier López', 'javier@fitcoach.test', 'cliente123', {
    goal: 'Ganar masa muscular', trainerId: trainer.id,
  });
  const lucia = mk('client', 'Lucía Martín', 'lucia@fitcoach.test', 'cliente123', {
    goal: 'Tonificar y movilidad', trainerId: trainer.id,
  });
  const pablo = mk('client', 'Pablo Sánchez', 'pablo@fitcoach.test', 'cliente123', {
    goal: 'Preparar media maratón', trainerId: trainer.id,
  });

  const ex = (client, o) => ({
    id: uid(), clientId: client.id, trainerId: trainer.id,
    sets: 3, reps: '12', rest: 60, day: 0, description: '', notes: '', media: null,
    doneWeek: null, createdAt: new Date().toISOString(), ...o,
  });

  const exercises = [
    ex(maria, {
      name: 'Sentadilla goblet', sets: 4, reps: '12', rest: 60, day: 0,
      description: 'Sujeta una mancuerna junto al pecho, baja con la espalda recta hasta que los muslos queden paralelos al suelo y sube empujando con los talones.',
      notes: 'Mantén las rodillas alineadas con las puntas de los pies y exhala al subir.',
      media: { type: 'video', url: 'https://youtu.be/aB3dEf9GhIj', videoId: 'aB3dEf9GhIj' },
    }),
    ex(maria, {
      name: 'Zancadas con mancuernas', sets: 3, reps: '10', rest: 60, day: 0,
      description: 'Da un paso largo hacia delante y baja hasta que ambas rodillas formen 90 grados. Empuja con el talón delantero para volver.',
      notes: 'Tronco erguido y mirada al frente.',
      media: { type: 'video', url: 'https://youtu.be/Zx9yKq2LmNp', videoId: 'Zx9yKq2LmNp' },
    }),
    ex(maria, {
      name: 'Puente de glúteo', sets: 3, reps: '15', rest: 45, day: 0,
      description: 'Tumbada boca arriba con las rodillas flexionadas, eleva la cadera apretando glúteos y mantén un segundo arriba antes de bajar.',
      notes: 'No arquees la zona lumbar: sube hasta formar una línea recta de hombros a rodillas.',
    }),
    ex(maria, {
      name: 'Press con mancuernas', sets: 4, reps: '10', rest: 75, day: 2,
      description: 'Tumbada en un banco, empuja las mancuernas hacia arriba hasta extender los codos y baja de forma controlada.',
      notes: 'Escápulas juntas y pies firmes en el suelo.',
      media: { type: 'video', url: 'https://youtu.be/Kp3rTs8WvQc', videoId: 'Kp3rTs8WvQc' },
    }),
    ex(maria, {
      name: 'Flexiones', sets: 3, reps: '12', rest: 60, day: 2,
      description: 'Manos a la anchura de los hombros, cuerpo en línea recta, baja el pecho hasta casi tocar el suelo y empuja.',
      notes: 'Si es difícil, apoya las rodillas.',
    }),
    ex(javier, {
      name: 'Press de banca', sets: 4, reps: '8', rest: 90, day: 1,
      description: 'Barra a la altura del pecho, agarre algo más ancho que los hombros, baja controlado y empuja explosivo.',
      notes: 'Pide ayuda al fondo de la serie.',
    }),
    ex(javier, {
      name: 'Peso muerto rumano', sets: 4, reps: '8', rest: 90, day: 3,
      description: 'Barra pegada a las piernas, cadera hacia atrás con espalda neutra hasta sentir tensión en isquios.',
      notes: 'Rodillas ligeramente flexionadas durante todo el movimiento.',
    }),
  ];

  const meal = (type, name, kcal, foods, recipe = '', notes = '') => ({
    id: uid(), type, name, kcal,
    foods: foods.map(([n, q]) => ({ name: n, qty: q })), recipe, notes,
  });

  const dayMenu = (variant) => {
    const v = variant % 2 === 0;
    return [
      meal('Desayuno', v ? 'Bowl de avena con plátano' : 'Tostadas con tomate y jamón', v ? 420 : 400,
        v ? [['Avena', '60 g'], ['Plátano', '1 unidad'], ['Yogur griego', '125 g']]
          : [['Pan integral', '60 g'], ['Tomate rallado', '80 g'], ['Jamón serrano', '40 g']],
        v ? '1. Calienta la avena con leche 3 minutos.\n2. Añade el plátano troceado.\n3. Termina con el yogur por encima.'
          : '1. Tuesta el pan.\n2. Añade el tomate y un chorrito de aceite.\n3. Pon el jamón por encima.'),
      meal('Media mañana', 'Fruta y frutos secos', 180, [['Manzana', '1 unidad'], ['Almendras', '20 g']]),
      meal('Comida', v ? 'Pollo a la plancha con arroz integral' : 'Lentejas estofadas con verduras', v ? 640 : 610,
        v ? [['Pechuga de pollo', '150 g'], ['Arroz integral (crudo)', '80 g'], ['Brócoli al vapor', '150 g'], ['Aceite de oliva virgen', '10 ml']]
          : [['Lentejas (crudas)', '80 g'], ['Zanahoria', '60 g'], ['Pimiento', '60 g'], ['Aceite de oliva virgen', '10 ml']],
        v ? '1. Cuece el arroz integral durante 25 minutos y escúrrelo.\n2. Cocina el pollo a la plancha 5 minutos por cada lado.\n3. Cuece el brócoli al vapor 6 minutos y añade el aceite en crudo.'
          : '1. Sofríe la verdura 5 minutos.\n2. Añade las lentejas y cubre con agua.\n3. Cuece 25 minutos a fuego medio.',
        'Bebe un vaso de agua con la comida y mastica despacio.'),
      meal('Merienda', 'Tostada con aguacate', 220, [['Pan integral', '40 g'], ['Aguacate', '1/2 unidad']]),
      meal('Cena', v ? 'Merluza al horno con verduras' : 'Tortilla de espinacas', v ? 480 : 450,
        v ? [['Merluza', '180 g'], ['Calabacín', '120 g'], ['Patata', '150 g']]
          : [['Huevos', '2 unidades'], ['Espinacas', '100 g'], ['Pan integral', '30 g']]),
    ];
  };

  const diets = {
    [maria.id]: {
      days: Object.fromEntries(Array.from({ length: 7 }, (_, d) => [d, dayMenu(d)])),
      updatedAt: new Date().toISOString(),
    },
  };

  return {
    users: [trainer, maria, javier, lucia, pablo],
    exercises,
    diets,
    sessions: {},
  };
}
