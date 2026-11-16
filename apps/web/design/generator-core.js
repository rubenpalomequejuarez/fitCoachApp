/* Native Figma development plugin. The assets and sample data are prepended by build-figma-kit.mjs. */
async function buildFitCoach() {
  const D = FITCOACH_DATA,
    created = [],
    pending = [],
    links = [],
    screens = {},
    mainComponents = {},
    vars = {},
    textStyles = {};
  const palette = {
    primary: "#5A6B2F",
    "primary-dark": "#3F4A24",
    bg: "#F5EFE3",
    surface: "#EAE0CC",
    border: "#D9CBAE",
    accent: "#B85C38",
    text: "#2B2A22",
    muted: "#6E6A5C",
    success: "#7A9A4E",
    error: "#B3402F",
    white: "#FFFFFF",
  };
  const rgb = (hex) => ({
    r: parseInt(hex.slice(1, 3), 16) / 255,
    g: parseInt(hex.slice(3, 5), 16) / 255,
    b: parseInt(hex.slice(5, 7), 16) / 255,
  });
  const track = (n) => {
    created.push(n.id);
    return n;
  };
  const fonts = await figma.listAvailableFontsAsync();
  const findFont = (styles) => {
    for (const s of styles) {
      const f = fonts.find(
        (f) => f.fontName.family === "Inter" && f.fontName.style === s,
      );
      if (f) return f.fontName;
    }
    throw new Error(
      "Instala Inter con estilos Regular, Medium y Semi Bold para ejecutar el generador.",
    );
  };
  const F = {
    regular: findFont(["Regular"]),
    medium: findFont(["Medium"]),
    semibold: findFont(["Semi Bold", "SemiBold"]),
  };
  await Promise.all(Object.values(F).map((f) => figma.loadFontAsync(f)));
  const page = track(figma.createPage());
  page.name = "FitCoach · Diseño y prototipo";
  await figma.setCurrentPageAsync(page);
  page.backgrounds = [{ type: "SOLID", color: rgb("#DDD5C5") }];
  const primitives = figma.variables.createVariableCollection(
    "FitCoach · Primitivos",
  );
  primitives.renameMode(primitives.modes[0].modeId, "Base");
  const semantic = figma.variables.createVariableCollection(
    "FitCoach · Variables",
  );
  semantic.renameMode(semantic.modes[0].modeId, "Natural");
  const collectionIds = [primitives.id, semantic.id],
    variableIds = [];
  for (const [name, value] of Object.entries(palette)) {
    const p = figma.variables.createVariable(
      "palette/" + name,
      primitives,
      "COLOR",
    );
    p.scopes = [];
    p.setValueForMode(primitives.modes[0].modeId, { ...rgb(value), a: 1 });
    p.setVariableCodeSyntax("WEB", `var(--color-${name})`);
    variableIds.push(p.id);
    const v = figma.variables.createVariable(
      "color/" + name,
      semantic,
      "COLOR",
    );
    v.scopes = ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"];
    v.setValueForMode(semantic.modes[0].modeId, {
      type: "VARIABLE_ALIAS",
      id: p.id,
    });
    v.setVariableCodeSyntax("WEB", `var(--color-${name})`);
    v.setVariableCodeSyntax(
      "ANDROID",
      `FitCoachColor.${name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}`,
    );
    v.setVariableCodeSyntax(
      "iOS",
      `FitCoachColor.${name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}`,
    );
    vars[name] = v;
    variableIds.push(v.id);
  }
  function numberVariable(name, value, scopes, css) {
    const v = figma.variables.createVariable(name, semantic, "FLOAT");
    v.scopes = scopes;
    v.setValueForMode(semantic.modes[0].modeId, value);
    v.setVariableCodeSyntax("WEB", `var(${css})`);
    variableIds.push(v.id);
    return v;
  }
  for (const n of [4, 8, 12, 16, 24, 32, 48])
    vars["space" + n] = numberVariable(
      "spacing/" + n,
      n,
      ["GAP"],
      "--space-" + n / 4,
    );
  vars.radius = numberVariable(
    "radius/card",
    16,
    ["CORNER_RADIUS"],
    "--radius",
  );
  for (const n of [8, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32])
    vars["type" + n] = numberVariable(
      "typography/size/" + n,
      n,
      ["FONT_SIZE"],
      "--font-size-" + n,
    );
  const family = figma.variables.createVariable(
    "typography/family",
    semantic,
    "STRING",
  );
  family.scopes = ["FONT_FAMILY"];
  family.setValueForMode(semantic.modes[0].modeId, "Inter");
  family.setVariableCodeSyntax("WEB", "var(--font-family)");
  vars.family = family;
  variableIds.push(family.id);
  for (const [weight, font] of Object.entries(F)) {
    const v = figma.variables.createVariable(
      "typography/style/" + weight,
      semantic,
      "STRING",
    );
    v.scopes = ["FONT_STYLE"];
    v.setValueForMode(semantic.modes[0].modeId, font.style);
    v.setVariableCodeSyntax("WEB", `var(--font-style-${weight})`);
    vars["font" + weight] = v;
    variableIds.push(v.id);
  }
  for (const size of [8, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32])
    for (const weight of ["regular", "medium", "semibold"]) {
      const s = figma.createTextStyle();
      s.name = `FitCoach/${size}/${weight}`;
      s.fontName = F[weight];
      s.fontSize = size;
      s.lineHeight = { unit: "PERCENT", value: size >= 24 ? 120 : 155 };
      textStyles[size + weight] = s;
    }
  const shadow = figma.createEffectStyle();
  shadow.name = "FitCoach/Shadow/Warm";
  shadow.effects = [
    {
      type: "DROP_SHADOW",
      color: { ...rgb(palette.text), a: 0.045 },
      offset: { x: 0, y: 4 },
      radius: 20,
      spread: 0,
      visible: true,
      blendMode: "NORMAL",
    },
  ];
  const paint = (name) =>
    figma.variables.setBoundVariableForPaint(
      { type: "SOLID", color: rgb(palette[name] || palette.bg) },
      "color",
      vars[name] || vars.bg,
    );
  function fill(n, name = "bg") {
    n.fills = [paint(name)];
  }
  function radius(n) {
    n.cornerRadius = 16;
    for (const k of [
      "topLeftRadius",
      "topRightRadius",
      "bottomLeftRadius",
      "bottomRightRadius",
    ])
      n.setBoundVariable(k, vars.radius);
  }
  function layout(
    name,
    width = 342,
    direction = "VERTICAL",
    gap = 12,
    pad = 0,
    bg,
  ) {
    const f = track(figma.createFrame());
    f.name = name;
    f.layoutMode = direction;
    f.resize(width, 1);
    f.primaryAxisSizingMode = "AUTO";
    f.counterAxisSizingMode = "FIXED";
    f.itemSpacing = gap;
    f.paddingLeft = f.paddingRight = f.paddingTop = f.paddingBottom = pad;
    f.fills = bg ? [paint(bg)] : [];
    if (vars["space" + gap])
      f.setBoundVariable("itemSpacing", vars["space" + gap]);
    if (vars["space" + pad])
      for (const k of [
        "paddingLeft",
        "paddingRight",
        "paddingTop",
        "paddingBottom",
      ])
        f.setBoundVariable(k, vars["space" + pad]);
    return f;
  }
  function txt(
    value,
    size = 12,
    weight = "regular",
    color = "text",
    width = 342,
  ) {
    const n = track(figma.createText());
    n.name = value.slice(0, 50) || "Texto";
    n.fontName = F[weight];
    n.characters = value;
    n.fontSize = size;
    n.lineHeight = { unit: "PERCENT", value: size >= 24 ? 120 : 155 };
    n.textAutoResize = "HEIGHT";
    n.resize(width, Math.max(1, size * 1.55));
    fill(n, color);
    pending.push(n.setTextStyleIdAsync(textStyles[size + weight].id));
    if (value.length) {
      n.setRangeBoundVariable(0, value.length, "fontFamily", vars.family);
      n.setRangeBoundVariable(
        0,
        value.length,
        "fontStyle",
        vars["font" + weight],
      );
      n.setRangeBoundVariable(0, value.length, "fontSize", vars["type" + size]);
    }
    return n;
  }
  function add(parent, node, fillWidth = true) {
    parent.appendChild(node);
    if (fillWidth && parent.layoutMode !== "NONE")
      node.layoutSizingHorizontal = "FILL";
    return node;
  }
  function icon(name, size = 20, color = "primary-dark") {
    const svg = FITCOACH_ICONS[name].replaceAll(
      "#3F4A24",
      palette[color] || palette["primary-dark"],
    );
    const n = track(figma.createNodeFromSvg(svg));
    n.name = "Icon/" + name;
    n.resize(size, size);
    return n;
  }
  function row(parent, name, gap = 12) {
    return add(
      parent,
      layout(
        name,
        parent.width - parent.paddingLeft - parent.paddingRight,
        "HORIZONTAL",
        gap,
      ),
      true,
    );
  }
  function label(parent, value) {
    add(parent, txt(value, 8, "semibold", "primary"));
  }
  function text(parent, value, size = 12, weight = "regular", color = "text") {
    return add(
      parent,
      txt(
        value,
        size,
        weight,
        color,
        parent.width - parent.paddingLeft - parent.paddingRight,
      ),
    );
  }
  function photo(name, w, h) {
    const r = track(figma.createRectangle());
    r.name = "Photo/" + name;
    r.resize(w, h);
    r.cornerRadius = 12;
    r.fills = [
      {
        type: "IMAGE",
        scaleMode: "FILL",
        imageHash: figma.createImage(figma.base64Decode(FITCOACH_PHOTOS[name]))
          .hash,
      },
    ];
    return r;
  }
  function vector(name, w, h) {
    const n = track(figma.createNodeFromSvg(FITCOACH_VECTORS[name]));
    n.name = "Illustration/" + name;
    n.resize(w, h);
    return n;
  }
  function navigate(node, target) {
    links.push({ node, target });
  }
  function linkURL(node, url) {
    links.push({ node, url });
  }
  function note(parent, title, body) {
    const n = add(
      parent,
      layout("Coach note", 342, "VERTICAL", 8, 16, "surface"),
    );
    radius(n);
    text(n, title, 11, "semibold", "primary-dark");
    text(n, body, 11, "regular", "muted");
    return n;
  }
  /* Adapted from the skill's createComponentWithVariants helper: components first, then combine and grid. */
  function makeSet(name, variants, width, height, build) {
    const components = variants.map((v) => {
      const c = track(figma.createComponent());
      c.name = v.name;
      c.layoutMode = "HORIZONTAL";
      c.primaryAxisAlignItems = "CENTER";
      c.counterAxisAlignItems = "CENTER";
      c.resize(width, height);
      c.primaryAxisSizingMode = "FIXED";
      c.counterAxisSizingMode = "FIXED";
      build(c, v);
      return c;
    });
    const set = track(figma.combineAsVariants(components, page));
    set.name = "FitCoach/" + name;
    set.description =
      "Componente reutilizable de FitCoach. Variables enlazadas; variantes para sus estados de uso.";
    const cols = Math.min(3, components.length);
    components.forEach((c, i) => {
      c.x = 24 + (i % cols) * (width + 24);
      c.y = 48 + Math.floor(i / cols) * (height + 24);
    });
    set.resize(
      48 + cols * (width + 24),
      72 + Math.ceil(components.length / cols) * (height + 24),
    );
    set.x = 100 + Object.keys(mainComponents).length * 10;
    set.y = 100;
    mainComponents[name] = { set, components };
    return set;
  }
  const buttonVariants = [];
  for (const style of ["Primary", "Secondary", "Accent"])
    for (const state of ["Default", "Pressed", "Disabled"])
      buttonVariants.push({
        name: `Style=${style}, State=${state}`,
        style,
        state,
      });
  makeSet("Button", buttonVariants, 342, 50, (c, v) => {
    const col =
      v.style === "Accent"
        ? "accent"
        : v.style === "Secondary"
          ? "surface"
          : v.state === "Pressed"
            ? "primary-dark"
            : "primary";
    fill(c, col);
    radius(c);
    c.paddingLeft = c.paddingRight = 20;
    c.itemSpacing = 12;
    if (v.state === "Disabled") c.opacity = 0.42;
    const t = txt(
      "Continuar",
      12,
      "medium",
      v.style === "Secondary" ? "primary-dark" : "white",
      280,
    );
    t.textAlignHorizontal = "CENTER";
    c.appendChild(t);
  });
  makeSet(
    "Input",
    ["Default", "Filled", "Error", "Disabled"].map((state) => ({
      name: `State=${state}`,
      state,
    })),
    342,
    80,
    (c, v) => {
      c.layoutMode = "VERTICAL";
      c.primaryAxisAlignItems = "MIN";
      c.counterAxisAlignItems = "MIN";
      c.itemSpacing = 7;
      c.fills = [];
      const l = txt("Etiqueta", 11, "medium", "text", 342);
      c.appendChild(l);
      const b = layout("Field", 342, "HORIZONTAL", 8, 12, "bg");
      b.resize(342, 48);
      b.primaryAxisSizingMode = "FIXED";
      radius(b);
      b.strokes = [paint(v.state === "Error" ? "error" : "border")];
      c.appendChild(b);
      const t = txt(
        v.state === "Filled"
          ? "Texto introducido"
          : v.state === "Error"
            ? "email incompleto"
            : "Escribe aquí…",
        12,
        "regular",
        "muted",
        310,
      );
      b.appendChild(t);
      if (v.state === "Disabled") c.opacity = 0.42;
    },
  );
  makeSet(
    "Chip",
    ["Default", "Active", "Completed", "Error"].map((state) => ({
      name: `State=${state}`,
      state,
    })),
    100,
    31,
    (c, v) => {
      radius(c);
      fill(c, v.state === "Active" ? "primary" : "surface");
      c.appendChild(
        txt(
          v.state === "Completed"
            ? "Completado"
            : v.state === "Error"
              ? "Revisar"
              : "Personalizado",
          10,
          "medium",
          v.state === "Active"
            ? "white"
            : v.state === "Error"
              ? "error"
              : "primary-dark",
          90,
        ),
      );
    },
  );
  makeSet(
    "Tab",
    ["Inactive", "Active"].map((state) => ({ name: `State=${state}`, state })),
    150,
    56,
    (c, v) => {
      c.layoutMode = "VERTICAL";
      c.itemSpacing = 5;
      fill(c, v.state === "Active" ? "surface" : "bg");
      radius(c);
      c.appendChild(
        icon("Utensils", 20, v.state === "Active" ? "primary" : "muted"),
      );
      const t = txt(
        "Dieta semanal",
        10,
        v.state === "Active" ? "semibold" : "regular",
        v.state === "Active" ? "primary" : "muted",
        140,
      );
      t.textAlignHorizontal = "CENTER";
      c.appendChild(t);
    },
  );
  makeSet(
    "Checkbox",
    ["Unchecked", "Checked"].map((state) => ({
      name: `State=${state}`,
      state,
    })),
    342,
    64,
    (c, v) => {
      fill(c, v.state === "Checked" ? "surface" : "bg");
      radius(c);
      c.paddingLeft = c.paddingRight = 16;
      c.itemSpacing = 12;
      const b = layout(
        "Check",
        24,
        "HORIZONTAL",
        0,
        0,
        v.state === "Checked" ? "primary" : "bg",
      );
      b.resize(24, 24);
      b.primaryAxisSizingMode = "FIXED";
      b.cornerRadius = 6;
      b.strokes = [paint("primary")];
      b.primaryAxisAlignItems = "CENTER";
      b.counterAxisAlignItems = "CENTER";
      c.appendChild(b);
      if (v.state === "Checked") b.appendChild(icon("Check", 16, "white"));
      c.appendChild(
        txt(
          v.state === "Checked"
            ? "Ejercicio completado"
            : "Marcar como completado",
          12,
          "medium",
          "primary-dark",
          270,
        ),
      );
    },
  );
  makeSet(
    "Card/Meal",
    [{ name: "State=Default" }, { name: "State=Pressed" }],
    342,
    112,
    (c, v) => {
      fill(c, "surface");
      radius(c);
      c.paddingLeft = c.paddingRight = c.paddingTop = c.paddingBottom = 8;
      c.itemSpacing = 12;
      c.primaryAxisAlignItems = "MIN";
      c.appendChild(photo("oats.jpg", 84, 96));
      const copy = layout("Meal copy", 226, "VERTICAL", 4);
      c.appendChild(copy);
      text(copy, "DESAYUNO · 420 kcal", 8, "medium", "primary");
      text(copy, "Avena con frutos rojos", 12, "semibold", "primary-dark");
      text(copy, "Avena · yogur · frutos rojos", 10, "regular", "muted");
      text(copy, "Ver receta ↗", 10, "medium", "primary");
      c.effects = shadow.effects;
    },
  );
  makeSet(
    "Card/Exercise",
    ["Default", "Completed"].map((state) => ({
      name: `State=${state}`,
      state,
    })),
    342,
    100,
    (c, v) => {
      fill(c, "surface");
      radius(c);
      c.paddingLeft = c.paddingRight = c.paddingTop = c.paddingBottom = 10;
      c.itemSpacing = 12;
      c.primaryAxisAlignItems = "MIN";
      c.appendChild(vector("squat.svg", 75, 80));
      const copy = layout("Exercise copy", 221, "VERTICAL", 4);
      c.appendChild(copy);
      text(copy, "Sentadilla goblet", 12, "semibold", "primary-dark");
      text(copy, "3 series × 12 repeticiones", 11, "regular", "muted");
      text(
        copy,
        v.state === "Completed" ? "✓ Completado" : "90 s de descanso",
        10,
        "regular",
        v.state === "Completed" ? "primary" : "muted",
      );
    },
  );
  makeSet(
    "Card/Client",
    [{ name: "State=Default" }, { name: "State=New" }],
    342,
    106,
    (c, v) => {
      fill(c, "surface");
      radius(c);
      c.paddingLeft = c.paddingRight = 16;
      c.itemSpacing = 12;
      c.primaryAxisAlignItems = "MIN";
      const a = layout("Avatar", 46, "HORIZONTAL", 0, 0, "bg");
      a.resize(46, 46);
      a.primaryAxisSizingMode = "FIXED";
      a.cornerRadius = 23;
      a.primaryAxisAlignItems = "CENTER";
      a.counterAxisAlignItems = "CENTER";
      a.appendChild(txt("AG", 14, "medium", "primary-dark", 26));
      c.appendChild(a);
      const copy = layout("Client copy", 230, "VERTICAL", 4);
      c.appendChild(copy);
      text(copy, "Ana García", 14, "semibold", "primary-dark");
      text(copy, "Ganar fuerza y sentirme bien", 10, "regular", "muted");
      text(
        copy,
        v.name.includes("New") ? "Nuevo · Por preparar" : "● Plan en marcha",
        10,
        "regular",
        "primary",
      );
    },
  );
  /* Expose editable text properties without detaching instances. */
  for (const [name, { set, components }] of Object.entries(mainComponents)) {
    const first = components[0].findAllWithCriteria({ types: ["TEXT"] });
    first.forEach((t, index) => {
      const key = set.addComponentProperty(
        index === 0 ? "Label" : "Text " + (index + 1),
        "TEXT",
        t.characters,
      );
      for (const c of components) {
        const child = c.findAllWithCriteria({ types: ["TEXT"] })[index];
        if (child) child.componentPropertyReferences = { characters: key };
      }
    });
    if (name === "Input")
      for (const c of components)
        for (const child of c.children) {
          child.layoutSizingHorizontal = "FILL";
        }
  }
  /* Organize main components separately from review screens. */
  let componentY = 320;
  for (const [name, { set }] of Object.entries(mainComponents)) {
    set.x = 100;
    set.y = componentY;
    componentY += set.height + 90;
  }
  const foundation = layout("00 · Fundamentos", 1000, "VERTICAL", 24, 32, "bg");
  foundation.x = 1300;
  foundation.y = 100;
  page.appendChild(foundation);
  radius(foundation);
  text(foundation, "fitcoach.", 32, "semibold", "primary-dark");
  label(foundation, "NATURAL · CÁLIDO · EN EQUILIBRIO");
  text(
    foundation,
    "Un mismo lenguaje para cuidar y acompañar.",
    24,
    "semibold",
    "primary-dark",
  );
  text(
    foundation,
    "Variables semánticas, auto-layout y componentes reutilizables. Todos los frames móviles miden 390 × 844.",
    14,
    "regular",
    "muted",
  );
  for (const [name, hex] of Object.entries(palette)) {
    const r = row(foundation, "Color/" + name, 16);
    r.counterAxisAlignItems = "CENTER";
    const swatch = track(figma.createRectangle());
    swatch.resize(56, 36);
    swatch.cornerRadius = 8;
    fill(swatch, name);
    r.appendChild(swatch);
    r.appendChild(txt(`${name}  ${hex}`, 12, "regular", "text", 600));
  }
  text(
    foundation,
    "Inter · Títulos semibold / texto regular",
    24,
    "semibold",
    "primary-dark",
  );
  text(
    foundation,
    "Escala: 8 · 10 · 11 · 12 · 14 · 16 · 18 · 20 · 24 · 28 · 32",
    14,
    "regular",
    "muted",
  );
  text(
    foundation,
    "Espaciado: 4 · 8 · 12 · 16 · 24 · 32 · 48 px. Radio: 16 px.",
    14,
    "regular",
    "muted",
  );
  function instance(name, variant = 0) {
    const n = track(mainComponents[name].components[variant].createInstance());
    n.name = "Instance/" + name;
    return n;
  }
  function replaceText(instance, values) {
    const texts = instance.findAllWithCriteria({ types: ["TEXT"] });
    values.forEach((value, i) => {
      if (texts[i]) {
        texts[i].characters = value;
        const n = texts[i];
        if (value.length)
          n.setRangeBoundVariable(0, value.length, "fontFamily", vars.family);
      }
    });
  }
  function button(parent, title, target, style = "Primary", disabled = false) {
    const index = buttonVariants.findIndex(
      (v) =>
        v.style === style && v.state === (disabled ? "Disabled" : "Default"),
    );
    const b = add(parent, instance("Button", index));
    replaceText(b, [title]);
    if (target && !disabled) navigate(b, target);
    return b;
  }
  function input(parent, title, value = "", error = false, target) {
    const n = add(parent, instance("Input", error ? 2 : value ? 1 : 0));
    replaceText(n, [title, value || "Escribe aquí…"]);
    if (target) navigate(n, target);
    if (error)
      text(
        parent,
        "Revisa este campo antes de continuar.",
        10,
        "regular",
        "error",
      );
    return n;
  }
  function chip(parent, title, active = false, target) {
    const n = instance("Chip", active ? 1 : 0);
    n.resize(Math.min(160, Math.max(58, title.length * 7 + 22)), 31);
    parent.appendChild(n);
    replaceText(n, [title]);
    if (target) navigate(n, target);
    return n;
  }
  function title(parent, eyebrow, heading, description) {
    label(parent, eyebrow);
    text(parent, heading, 28, "semibold", "primary-dark");
    if (description) text(parent, description, 11, "regular", "muted");
  }
  function back(parent, label, target) {
    const r = row(parent, "Back", 8);
    r.resize(342, 36);
    r.primaryAxisSizingMode = "FIXED";
    r.counterAxisAlignItems = "CENTER";
    r.appendChild(icon("ArrowLeft", 18, "primary"));
    r.appendChild(txt(label, 11, "medium", "primary", 290));
    navigate(r, target);
  }
  let screenIndex = 0;
  const screenY = componentY + 200;
  function screen(key, name, role, active, header = true) {
    const f = layout(name, 390, "VERTICAL", 0, 0, "bg");
    f.resize(390, 844);
    f.primaryAxisSizingMode = "FIXED";
    f.counterAxisSizingMode = "FIXED";
    f.clipsContent = true;
    f.x = 100 + (screenIndex % 6) * 490;
    f.y = screenY + Math.floor(screenIndex / 6) * 1000;
    screenIndex++;
    page.appendChild(f);
    screens[key] = { frame: f };
    const status = layout("Status bar", 390, "HORIZONTAL", 12, 8, "bg");
    status.resize(390, 28);
    status.primaryAxisSizingMode = "FIXED";
    status.primaryAxisAlignItems = "SPACE_BETWEEN";
    status.counterAxisAlignItems = "CENTER";
    add(f, status);
    status.appendChild(txt("9:41", 10, "semibold", "primary-dark", 70));
    const sys = txt("•••  ▰", 10, "medium", "primary-dark", 60);
    sys.textAlignHorizontal = "RIGHT";
    status.appendChild(sys);
    if (header) {
      const h = layout("Header", 390, "HORIZONTAL", 12, 24, "bg");
      h.resize(390, 72);
      h.primaryAxisSizingMode = "FIXED";
      h.counterAxisAlignItems = "CENTER";
      add(f, h);
      h.appendChild(icon("Leaf", 26, "primary"));
      const copy = layout("Greeting", 242, "VERTICAL", 4);
      h.appendChild(copy);
      text(copy, "fitcoach.", 20, "semibold", "primary-dark");
      text(
        copy,
        role === "trainer" ? "Hola, Lucía" : "Hola, Ana",
        10,
        "regular",
        "muted",
      );
      const avatar = layout("Profile", 34, "HORIZONTAL", 0, 0, "surface");
      avatar.resize(34, 34);
      avatar.primaryAxisSizingMode = "FIXED";
      avatar.cornerRadius = 17;
      avatar.counterAxisAlignItems = "CENTER";
      avatar.primaryAxisAlignItems = "CENTER";
      avatar.appendChild(
        txt(role === "trainer" ? "LM" : "AG", 10, "medium", "primary-dark", 22),
      );
      h.appendChild(avatar);
      navigate(avatar, "switch-profile");
    }
    const viewport = layout("Scrollable viewport", 390, "VERTICAL", 0);
    const vh = 844 - 28 - (header ? 72 : 0) - (role ? 76 : 0);
    viewport.resize(390, vh);
    viewport.primaryAxisSizingMode = "FIXED";
    viewport.clipsContent = true;
    viewport.overflowDirection = "VERTICAL";
    add(f, viewport);
    const body = layout("Content", 390, "VERTICAL", 16, 24);
    viewport.appendChild(body);
    screens[key].body = body;
    if (role) {
      const nav = layout("Bottom navigation", 390, "HORIZONTAL", 8, 12, "bg");
      nav.resize(390, 76);
      nav.primaryAxisSizingMode = "FIXED";
      nav.counterAxisAlignItems = "CENTER";
      add(f, nav);
      const items =
        role === "trainer"
          ? [
              ["Clientes", "Users", "trainer-clients"],
              ["Ejercicios", "Dumbbell", "trainer-library"],
              ["Dietas", "BookOpen", "trainer-diets"],
            ]
          : [
              ["Dieta semanal", "Utensils", "client-diet-0"],
              ["Ejercicios", "Dumbbell", "client-exercises-0"],
            ];
      for (const [label, ico, target] of items) {
        const tab = instance("Tab", active === label ? 1 : 0);
        nav.appendChild(tab);
        tab.resize((366 - 8 * (items.length - 1)) / items.length, 52);
        replaceText(tab, [label]);
        const old = tab.findOne((n) => n.name === "Icon/Utensils");
        if (old) {
          const v = icon(ico, 20, active === label ? "primary" : "muted");
          tab.insertChild(0, v);
          old.visible = false;
        }
        navigate(tab, target);
      }
    }
    return body;
  }
  function dayStrip(parent, selected, prefix) {
    const r = row(parent, "Week selector", 5);
    for (let i = 0; i < 7; i++) {
      const b = layout(
        "Day/" + D.days[i],
        44,
        "VERTICAL",
        5,
        4,
        i === selected ? "primary" : "surface",
      );
      b.resize(44, 66);
      b.primaryAxisSizingMode = "FIXED";
      b.counterAxisAlignItems = "CENTER";
      b.primaryAxisAlignItems = "CENTER";
      r.appendChild(b);
      const a = txt(
        D.days[i],
        10,
        "medium",
        i === selected ? "white" : "muted",
        36,
      );
      a.textAlignHorizontal = "CENTER";
      b.appendChild(a);
      const n = txt(
        String(i === 6 ? 1 : 26 + i),
        18,
        "medium",
        i === selected ? "white" : "primary-dark",
        36,
      );
      n.textAlignHorizontal = "CENTER";
      b.appendChild(n);
      if (prefix) navigate(b, prefix + i);
    }
    return r;
  }
  function mealCard(parent, m, target) {
    const c = add(parent, instance("Card/Meal"));
    replaceText(c, [
      `${m.type.toUpperCase()} · ${m.kcal} kcal`,
      m.name,
      m.summary,
      "Ver receta ↗",
    ]);
    const p = c.findOne(
      (n) => n.type === "RECTANGLE" && n.name.startsWith("Photo/"),
    );
    if (p)
      p.fills = [
        {
          type: "IMAGE",
          scaleMode: "FILL",
          imageHash: figma.createImage(
            figma.base64Decode(FITCOACH_PHOTOS[m.image]),
          ).hash,
        },
      ];
    navigate(c, target);
    return c;
  }
  function exerciseCard(parent, e, target, done = false) {
    const c = add(parent, instance("Card/Exercise", done ? 1 : 0));
    replaceText(c, [
      e.name,
      `${e.sets} series × ${e.reps}`,
      done ? "✓ Completado" : `${e.rest} s de descanso`,
    ]);
    navigate(c, target);
    return c;
  }
  function clientCard(parent, c, target) {
    const n = add(parent, instance("Card/Client", c.id === "leo" ? 1 : 0));
    replaceText(n, [
      c.initials,
      c.name,
      c.goal,
      c.id === "leo" ? "Nuevo · Por preparar" : "● Plan en marcha",
    ]);
    navigate(n, target);
    return n;
  }
  function empty(parent, type, heading, description, cta, target) {
    const box = add(
      parent,
      layout("Empty state", 342, "VERTICAL", 16, 24, "surface"),
    );
    radius(box);
    box.counterAxisAlignItems = "CENTER";
    box.appendChild(icon(type, 38, "primary"));
    text(box, heading, 20, "semibold", "primary-dark");
    text(box, description, 12, "regular", "muted");
    if (cta) button(box, cta, target, "Secondary");
  }
  /* Access */
  for (const role of ["client", "trainer"]) {
    const b = screen(
      "login-" + role,
      "Acceso · " + (role === "client" ? "Cliente" : "Entrenador"),
      null,
      null,
      false,
    );
    b.itemSpacing = 20;
    const brand = row(b, "Brand");
    brand.counterAxisAlignItems = "CENTER";
    brand.appendChild(icon("Leaf", 32, "primary"));
    brand.appendChild(txt("fitcoach.", 24, "semibold", "primary-dark", 240));
    text(b, "A TU RITMO, CONTIGO", 8, "semibold", "primary");
    title(
      b,
      "",
      "Qué bien tenerte\npor aquí.",
      "Cada pequeño paso cuenta. Vamos con el de hoy.",
    );
    const seg = row(b, "Profile selector", 8);
    chip(seg, "Entrenador", role === "trainer", "login-trainer");
    chip(seg, "Cliente", role === "client", "login-client");
    input(
      b,
      "Email",
      role === "client" ? "ana@fitcoach.demo" : "lucia@fitcoach.demo",
      false,
      "login-error",
    );
    input(b, "Contraseña", "••••••••••••", false, "login-show-password");
    button(b, "¿Olvidaste tu contraseña?", "reset", "Secondary");
    button(
      b,
      "Iniciar sesión",
      role === "client" ? "client-diet-6" : "trainer-clients",
    );
    note(
      b,
      "Prototipo interactivo",
      "Datos de demostración. Elige un perfil y entra para explorar.",
    );
  }
  {
    const b = screen("login-error", "Acceso · Error", null, null, false);
    title(
      b,
      "REVISAMOS UN DETALLE",
      "Vuelve a intentarlo",
      "Comprueba los campos para continuar.",
    );
    input(b, "Email", "ana@", true, "login-client");
    input(b, "Contraseña", "", true, "login-client");
    button(b, "Corregir datos", "login-client");
    button(b, "Volver", "login-client", "Secondary");
  }
  {
    const b = screen(
      "login-show-password",
      "Acceso · Contraseña visible",
      null,
      null,
      false,
    );
    back(b, "Volver", "login-client");
    title(
      b,
      "TU ESPACIO",
      "Todo empieza por aquí.",
      "Estado con contraseña visible.",
    );
    input(b, "Email", "ana@fitcoach.demo");
    input(b, "Contraseña", "fitcoach2026");
    button(b, "Ocultar contraseña", "login-client", "Secondary");
    button(b, "Iniciar sesión", "client-diet-0");
  }
  {
    const b = screen(
      "reset",
      "Acceso · Recuperar contraseña",
      null,
      null,
      false,
    );
    back(b, "Iniciar sesión", "login-client");
    title(
      b,
      "VOLVER A CONECTAR",
      "Recupera tu acceso.",
      "Escribe el email de tu cuenta.",
    );
    input(b, "Email", "ana@fitcoach.demo", false, "reset-error");
    button(b, "Solicitar enlace", "reset-sent");
    text(b, "Simulación: no se envía ningún email.", 11, "regular", "muted");
  }
  {
    const b = screen(
      "reset-error",
      "Acceso · Recuperación con error",
      null,
      null,
      false,
    );
    back(b, "Volver", "reset");
    title(b, "UN PEQUEÑO AJUSTE", "Revisa tu email.");
    input(b, "Email", "ana@", true, "reset");
    button(b, "Corregir email", "reset");
  }
  {
    const b = screen(
      "reset-sent",
      "Acceso · Recuperación confirmada",
      null,
      null,
      false,
    );
    empty(
      b,
      "Check",
      "Solicitud registrada",
      "Simulación completada. En una app real recibirías las instrucciones por email.",
      "Volver al acceso",
      "login-client",
    );
  }
  {
    const b = screen(
      "switch-profile",
      "Demo · Cambiar perfil",
      null,
      null,
      false,
    );
    title(
      b,
      "EXPLORAR LA DEMO",
      "Tu espacio, tu perspectiva.",
      "Cambia de perfil para recorrer todos los flujos.",
    );
    button(b, "Entrar como cliente", "client-diet-0");
    button(b, "Entrar como entrenador", "trainer-clients");
    button(b, "Ver cliente sin dieta", "client-empty-diet", "Secondary");
    button(
      b,
      "Ver cliente sin ejercicios",
      "client-empty-exercises",
      "Secondary",
    );
    button(b, "Cerrar sesión", "login-client", "Secondary");
  }
  /* Client diet and meal details */
  for (let day = 0; day < 7; day++) {
    const b = screen(
      "client-diet-" + day,
      "Cliente · Dieta · " + D.fullDays[day],
      "client",
      "Dieta semanal",
    );
    title(
      b,
      "NUTRIRTE TAMBIÉN ES CUIDARTE",
      "Comer bien.\nSentirte mejor.",
      "Tu plan de hoy, pensado para ti.",
    );
    text(b, "Tu semana, en equilibrio", 14, "semibold", "primary-dark");
    text(b, "Noviembre de 2026", 10, "regular", "muted");
    dayStrip(b, day, "client-diet-");
    text(b, D.fullDays[day] + " · 5 comidas", 12, "medium", "primary-dark");
    D.meals.forEach((m, i) => mealCard(b, m, "client-meal-" + i));
    note(
      b,
      "Una nota de tu entrenadora",
      "No buscamos días perfectos, sino pequeños hábitos que te hagan sentir bien.",
    );
  }
  D.meals.forEach((m, i) => {
    const b = screen(
      "client-meal-" + i,
      "Cliente · Receta · " + m.type,
      "client",
      "Dieta semanal",
    );
    back(b, "Dieta semanal", "client-diet-0");
    add(b, photo(m.image, 342, 220));
    title(b, m.type.toUpperCase(), m.name, m.summary);
    const badges = row(b, "Meal badges", 8);
    chip(badges, m.kcal + " kcal");
    chip(badges, "1 persona");
    text(b, "Lo que necesitas", 20, "semibold", "primary-dark");
    for (const food of m.ingredients) {
      const r = row(b, "Ingredient", 12);
      r.appendChild(txt(food.name, 12, "regular", "muted", 236));
      r.appendChild(txt(food.quantity, 12, "medium", "primary-dark", 80));
    }
    text(b, "Manos a la cocina", 20, "semibold", "primary-dark");
    m.recipe
      .split("\n")
      .forEach((step, j) =>
        text(b, `${j + 1}. ${step}`, 12, "regular", "muted"),
      );
    note(b, "Notas de tu entrenadora", m.notes);
  });
  /* Client routines and exercise details */
  for (const [day, index] of [
    [0, 0],
    [2, 1],
    [4, 2],
  ]) {
    const b = screen(
      "client-exercises-" + index,
      "Cliente · Rutina · " + (index + 1),
      "client",
      "Ejercicios",
    );
    title(
      b,
      "MOVIMIENTO CON INTENCIÓN",
      "Más fuerte.\nA tu ritmo.",
      "Cada repetición es un pequeño paso hacia ti.",
    );
    const r = row(b, "Routine tabs", 8);
    for (let i = 0; i < 3; i++)
      chip(r, "Día " + (i + 1), i === index, "client-exercises-" + i);
    const es = D.exercises.filter((e) => e.day === day);
    note(b, `DÍA ${index + 1} · ${D.fullDays[day].toUpperCase()}`, es[0].group);
    text(b, `Tu progreso de hoy · 0 de ${es.length}`, 11, "medium", "primary");
    es.forEach((e) => exerciseCard(b, e, "client-exercise-" + e.id));
  }
  for (const e of D.exercises)
    for (const done of [false, true]) {
      const key = "client-exercise-" + e.id + (done ? "-done" : "");
      const b = screen(
        key,
        `Cliente · ${e.name}${done ? " · Completado" : ""}`,
        "client",
        "Ejercicios",
      );
      back(
        b,
        "Ejercicios",
        "client-exercises-" + (e.day === 0 ? 0 : e.day === 2 ? 1 : 2),
      );
      add(b, vector(e.image, 342, 235));
      if (e.resource === "video") {
        const r = row(b, "Video thumbnail", 10);
        r.appendChild(icon("Play", 22, "primary"));
        r.appendChild(txt("Se abre en YouTube", 11, "medium", "primary", 280));
        linkURL(r, e.url);
        button(b, "Ver vídeo ↗", null, "Secondary");
        linkURL(b.children[b.children.length - 1], e.url);
        text(
          b,
          "Ejemplo público de NASM. Sustituible por vídeo privado.",
          10,
          "regular",
          "muted",
        );
      }
      title(
        b,
        D.fullDays[e.day].toUpperCase(),
        e.name,
        `${e.sets} series × ${e.reps} · ${e.rest} s de descanso`,
      );
      text(b, "Cuida la técnica", 20, "semibold", "primary-dark");
      text(b, e.technique, 12, "regular", "muted");
      note(b, "Consejos de tu entrenadora", e.notes);
      const check = add(b, instance("Checkbox", done ? 1 : 0));
      navigate(check, "client-exercise-" + e.id + (done ? "" : "-done"));
    }
  {
    const b = screen(
      "client-empty-diet",
      "Cliente · Sin dieta",
      "client",
      "Dieta semanal",
    );
    title(b, "CADA DÍA CUENTA", "Tu semana empieza aquí.");
    dayStrip(b, 0, "client-diet-");
    empty(
      b,
      "Utensils",
      "Un nuevo día por preparar",
      "Tu entrenador todavía no ha asignado una dieta para este día. Aparecerá aquí cuando esté lista.",
    );
  }
  {
    const b = screen(
      "client-empty-exercises",
      "Cliente · Sin ejercicios",
      "client",
      "Ejercicios",
    );
    title(b, "MOVIMIENTO CON INTENCIÓN", "Un paso a la vez.");
    empty(
      b,
      "Dumbbell",
      "Tu próxima rutina empieza aquí",
      "Tu entrenador todavía no te ha asignado ejercicios. En cuanto el plan esté listo, aparecerá aquí.",
    );
  }
  /* Trainer clients */
  {
    const b = screen(
      "trainer-clients",
      "Entrenador · Clientes",
      "trainer",
      "Clientes",
    );
    title(
      b,
      "ACOMPAÑAR ES HACER EQUIPO",
      "Pequeños pasos.\nGrandes progresos.",
      "Un espacio para acompañar a cada persona.",
    );
    button(b, "+ Añadir cliente", "trainer-add");
    input(
      b,
      "Buscar cliente",
      "Buscar nombre u objetivo…",
      false,
      "trainer-search-empty",
    );
    D.clients.forEach((c) =>
      clientCard(
        b,
        c,
        c.id === "leo" ? "trainer-client-empty" : "trainer-client",
      ),
    );
  }
  {
    const b = screen(
      "trainer-search-empty",
      "Entrenador · Búsqueda vacía",
      "trainer",
      "Clientes",
    );
    back(b, "Todos los clientes", "trainer-clients");
    input(b, "Buscar cliente", "Sin coincidencias");
    empty(
      b,
      "Users",
      "No encontramos coincidencias",
      "Prueba con otro nombre o añade tu primer cliente.",
      "Limpiar búsqueda",
      "trainer-clients",
    );
  }
  for (const error of [false, true]) {
    const b = screen(
      error ? "trainer-add-error" : "trainer-add",
      error
        ? "Entrenador · Añadir cliente · Error"
        : "Entrenador · Añadir cliente",
      "trainer",
      "Clientes",
    );
    back(b, "Todos los clientes", "trainer-clients");
    title(
      b,
      "UN NUEVO COMIENZO",
      "Vamos a hacer equipo.",
      "Añade a tu cliente y empieza a construir su plan.",
    );
    input(
      b,
      "Nombre y apellidos",
      error ? "" : "Laura Sánchez",
      error,
      "trainer-add",
    );
    input(
      b,
      "Email",
      error ? "laura@" : "laura@fitcoach.demo",
      error,
      "trainer-add",
    );
    input(
      b,
      "Objetivo",
      error ? "" : "Ganar fuerza y mejorar mis hábitos",
      error,
      "trainer-add",
    );
    button(b, "Añadir cliente", error ? "trainer-add" : "trainer-client-empty");
    button(b, "Ver estado de error", "trainer-add-error", "Secondary");
    text(
      b,
      "Demostración: no se envía ninguna invitación.",
      10,
      "regular",
      "muted",
    );
  }
  for (const emptyProfile of [false, true]) {
    const b = screen(
      emptyProfile ? "trainer-client-empty" : "trainer-client",
      emptyProfile
        ? "Entrenador · Cliente sin planes"
        : "Entrenador · Ficha de Ana",
      "trainer",
      "Clientes",
    );
    back(b, "Todos los clientes", "trainer-clients");
    title(
      b,
      "UN PLAN A SU MEDIDA",
      emptyProfile ? "Leo Fernández" : "Ana García",
      emptyProfile
        ? "Empezar a entrenar con constancia"
        : "Ganar fuerza y sentirme bien",
    );
    text(b, "Ejercicios asignados", 20, "semibold", "primary-dark");
    if (emptyProfile)
      empty(
        b,
        "Dumbbell",
        "Una rutina por construir",
        "Asigna su primer ejercicio.",
        "+ Añadir ejercicio",
        "trainer-exercise-image",
      );
    else
      D.exercises
        .slice(0, 3)
        .forEach((e) => exerciseCard(b, e, "trainer-exercise-detail"));
    button(b, "Editar ejercicios", "trainer-exercise-image", "Secondary");
    text(b, "Dieta semanal", 20, "semibold", "primary-dark");
    if (emptyProfile)
      empty(
        b,
        "Utensils",
        "Su plan está por empezar",
        "Prepara una dieta adaptada a su día a día.",
        "Crear dieta",
        "trainer-diet-empty",
      );
    else {
      note(b, "Su semana, en equilibrio", "7 días planificados para Ana.");
      button(b, "Editar dieta semanal", "trainer-diet-filled", "Secondary");
    }
  }
  /* Trainer exercise library and editor */
  {
    const b = screen(
      "trainer-library",
      "Entrenador · Biblioteca",
      "trainer",
      "Ejercicios",
    );
    title(
      b,
      "TU BIBLIOTECA DE MOVIMIENTO",
      "Entrenar con intención.",
      "Ejercicios que se adaptan a cada persona.",
    );
    button(b, "+ Crear ejercicio", "trainer-exercise-image");
    input(b, "Buscar ejercicio", "Sentadilla, peso muerto…");
    const r = row(b, "Filters", 8);
    chip(r, "Todos", true);
    chip(r, "Pierna y glúteo", false);
    D.exercises.forEach((e) => exerciseCard(b, e, "trainer-exercise-detail"));
  }
  {
    const b = screen(
      "trainer-exercise-detail",
      "Entrenador · Detalle de ejercicio",
      "trainer",
      "Ejercicios",
    );
    back(b, "Biblioteca", "trainer-library");
    add(b, vector("squat.svg", 342, 240));
    title(
      b,
      "PIERNA Y GLÚTEO",
      "Sentadilla goblet",
      "3 series × 12 repeticiones · 90 s de descanso",
    );
    text(b, D.exercises[0].technique, 12, "regular", "muted");
    note(b, "Consejos para el cliente", D.exercises[0].notes);
    button(b, "Editar ejercicio", "trainer-exercise-image");
  }
  for (const state of [
    "image",
    "image-uploaded",
    "video",
    "video-valid",
    "error",
  ]) {
    const err = state === "error",
      isVideo = state.startsWith("video"),
      b = screen(
        "trainer-exercise-" + state,
        "Entrenador · Ejercicio · " + state,
        "trainer",
        "Ejercicios",
      );
    back(b, "Biblioteca", "trainer-library");
    title(
      b,
      "MOVIMIENTO A SU MEDIDA",
      "Crear un ejercicio.",
      "Una buena explicación marca la diferencia.",
    );
    input(
      b,
      "Nombre del ejercicio",
      err ? "" : "Sentadilla goblet",
      err,
      "trainer-exercise-image",
    );
    const nums = row(b, "Sets Reps Rest", 8);
    for (const [label, value] of [
      ["Series", "3"],
      ["Repeticiones", "12"],
      ["Descanso (s)", "90"],
    ]) {
      const g = layout(label, 108, "VERTICAL", 4);
      nums.appendChild(g);
      g.appendChild(txt(label, 10, "medium", "muted", 100));
      g.appendChild(txt(value, 16, "medium", "primary-dark", 100));
    }
    text(b, "Día de la semana", 11, "medium", "text");
    dayStrip(b, 0, null);
    input(
      b,
      "Descripción técnica",
      "Sujeta la mancuerna frente al pecho y baja con control.",
    );
    input(b, "Notas para tu cliente", "Mantén un recorrido cómodo.");
    text(b, "Recurso explicativo", 16, "semibold", "primary-dark");
    const r = row(b, "Resource selector", 8);
    chip(r, "Subir imagen", !isVideo, "trainer-exercise-image");
    chip(r, "Enlace de vídeo", isVideo, "trainer-exercise-video");
    if (isVideo) {
      input(
        b,
        "URL de YouTube",
        state === "video-valid"
          ? "https://youtu.be/nfX7IFK9UNI"
          : "https://youtube…",
        state === "video",
        "trainer-exercise-video-valid",
      );
      if (state === "video-valid") {
        add(b, vector("squat.svg", 342, 160));
        note(
          b,
          "Vista previa · Se abre en YouTube",
          "El vídeo no se incrusta. Verifica los permisos de acceso si es privado.",
        );
      }
    } else if (state === "image-uploaded") {
      add(b, vector("squat.svg", 342, 160));
      button(b, "Cambiar imagen", "trainer-exercise-image", "Secondary");
    } else
      button(
        b,
        "+ Seleccionar imagen",
        "trainer-exercise-image-uploaded",
        "Secondary",
      );
    if (err)
      text(
        b,
        "Revisa el nombre y el recurso antes de continuar.",
        11,
        "regular",
        "error",
      );
    button(
      b,
      "Asignar a cliente",
      state === "video" || state === "image"
        ? "trainer-exercise-error"
        : "trainer-select-clients",
      "Accent",
    );
  }
  for (const selected of [false, true]) {
    const b = screen(
      selected ? "trainer-select-clients-selected" : "trainer-select-clients",
      selected
        ? "Entrenador · Clientes seleccionados"
        : "Entrenador · Seleccionar clientes",
      "trainer",
      "Ejercicios",
    );
    back(b, "Volver al ejercicio", "trainer-exercise-image-uploaded");
    title(
      b,
      "UN PASO MÁS",
      "¿A quién acompañamos?",
      "Selecciona uno o varios clientes para este ejercicio.",
    );
    input(b, "Buscar clientes", "");
    D.clients.forEach((c, i) => {
      const n = clientCard(b, c, "trainer-select-clients-selected");
      if (selected && i < 2) {
        const checks = n.findAllWithCriteria({ types: ["TEXT"] });
        checks[checks.length - 1].characters = "✓ Seleccionado";
      }
    });
    button(
      b,
      selected ? "Asignar a 2 clientes" : "Selecciona al menos un cliente",
      selected ? "trainer-assigned" : null,
      "Accent",
      !selected,
    );
  }
  {
    const b = screen(
      "trainer-assigned",
      "Entrenador · Ejercicio asignado",
      "trainer",
      "Ejercicios",
    );
    empty(
      b,
      "Check",
      "Un paso más, juntos.",
      "Sentadilla goblet está asignada a Ana y Marcos para el lunes.",
      "Ver ficha del cliente",
      "trainer-client",
    );
    button(b, "Volver a la biblioteca", "trainer-library", "Secondary");
  }
  /* Trainer diet editing */
  {
    const b = screen(
      "trainer-diets",
      "Entrenador · Dietas",
      "trainer",
      "Dietas",
    );
    title(
      b,
      "ALIMENTACIÓN QUE ACOMPAÑA",
      "Una semana para cuidarse.",
      "Planes sencillos y fáciles de seguir.",
    );
    input(b, "Buscar cliente", "");
    D.clients.forEach((c) => {
      clientCard(
        b,
        c,
        c.id === "leo" ? "trainer-diet-empty" : "trainer-diet-filled",
      );
      button(
        b,
        c.id === "leo" ? "Crear dieta" : "Editar plan",
        c.id === "leo" ? "trainer-diet-empty" : "trainer-diet-filled",
        "Secondary",
      );
    });
  }
  for (const state of ["empty", "filled", "food-added", "error"]) {
    const b = screen(
      "trainer-diet-" + state,
      "Entrenador · Dieta · " + state,
      "trainer",
      "Dietas",
    );
    back(b, "Dietas de tus clientes", "trainer-diets");
    title(
      b,
      "UN PLAN PARA ANA",
      "Una semana en equilibrio.",
      "Organiza las comidas. Deja espacio para disfrutar.",
    );
    dayStrip(b, 0, "trainer-diet-day-");
    text(
      b,
      "Lunes · " + (state === "empty" ? "0" : "1") + " comidas",
      16,
      "semibold",
      "primary-dark",
    );
    if (state === "empty")
      empty(
        b,
        "Utensils",
        "Un día lleno de posibilidades",
        "Añade una comida y empieza a preparar el menú.",
      );
    else {
      const box = add(
        b,
        layout("Meal editor", 342, "VERTICAL", 12, 16, "surface"),
      );
      radius(box);
      input(box, "Momento del día", "Desayuno");
      input(
        box,
        "Nombre del plato",
        state === "error" ? "" : "Avena con frutos rojos",
        state === "error",
        "trainer-diet-filled",
      );
      text(box, "Alimentos · nombre y cantidad", 12, "medium", "primary-dark");
      input(box, "Alimento 1", "Copos de avena · 60 g");
      input(box, "Alimento 2", "Yogur natural · 125 g");
      if (state === "food-added")
        input(box, "Alimento 3", "Frutos rojos · 80 g");
      button(box, "+ Añadir alimento", "trainer-diet-food-added", "Secondary");
      input(
        box,
        "Receta paso a paso",
        state === "error"
          ? ""
          : "1. Mezcla la avena con el yogur.\n2. Deja reposar y añade la fruta.",
        state === "error",
        "trainer-diet-filled",
      );
      input(box, "Calorías (opcional)", "420");
      input(
        box,
        "Notas del entrenador",
        "Puedes prepararlo la noche anterior.",
      );
    }
    button(b, "+ Añadir comida", "trainer-diet-filled", "Secondary");
    if (state !== "empty")
      button(b, "Copiar al resto de días", "trainer-diet-copied", "Secondary");
    button(
      b,
      "Guardar y enviar al cliente",
      state === "empty" || state === "error"
        ? "trainer-diet-error"
        : "trainer-diet-confirm",
      "Accent",
    );
  }
  for (let day = 0; day < 7; day++) {
    const b = screen(
      "trainer-diet-day-" + day,
      "Entrenador · Dieta · " + D.fullDays[day],
      "trainer",
      "Dietas",
    );
    back(b, "Dieta semanal", "trainer-diet-filled");
    title(b, "UN PLAN PARA ANA", D.fullDays[day] + ", a su ritmo.");
    dayStrip(b, day, "trainer-diet-day-");
    mealCard(b, D.meals[day % 5], "trainer-diet-filled");
    button(b, "+ Añadir comida", "trainer-diet-filled", "Secondary");
    button(b, "Guardar y enviar al cliente", "trainer-diet-confirm", "Accent");
  }
  {
    const b = screen(
      "trainer-diet-copied",
      "Entrenador · Semana copiada",
      "trainer",
      "Dietas",
    );
    back(b, "Editar menú", "trainer-diet-filled");
    title(
      b,
      "LA SEMANA TOMA FORMA",
      "7 días preparados.",
      "El menú se ha copiado al resto de días. Puedes adaptarlo antes de guardar.",
    );
    dayStrip(b, 0, "trainer-diet-day-");
    button(b, "Guardar y enviar al cliente", "trainer-diet-confirm", "Accent");
  }
  {
    const b = screen(
      "trainer-diet-confirm",
      "Entrenador · Confirmar dieta",
      "trainer",
      "Dietas",
    );
    back(b, "Seguir editando", "trainer-diet-filled");
    empty(
      b,
      "Leaf",
      "Su semana está lista",
      "Ana García recibirá el plan en su perfil de cliente. Esta demo no envía emails ni notificaciones externas.",
    );
    button(b, "Guardar y enviar al cliente", "trainer-diet-sent", "Accent");
    button(b, "Cancelar", "trainer-diet-filled", "Secondary");
  }
  {
    const b = screen(
      "trainer-diet-sent",
      "Entrenador · Dieta guardada",
      "trainer",
      "Dietas",
    );
    empty(
      b,
      "Check",
      "Un hábito a la vez.",
      "La dieta se ha guardado y está disponible para Ana.",
      "Ver ficha del cliente",
      "trainer-client",
    );
    button(b, "Explorar como cliente", "client-diet-0", "Secondary");
  }
  await Promise.all(pending);
  const missing = links.filter((l) => l.target && !screens[l.target]);
  if (missing.length)
    throw new Error(
      "Destinos pendientes: " + missing.map((x) => x.target).join(", "),
    );
  for (const l of links) {
    await l.node.setReactionsAsync([
      {
        trigger: { type: "ON_CLICK" },
        actions: l.url
          ? [{ type: "URL", url: l.url, openInNewTab: true }]
          : [
              {
                type: "NODE",
                destinationId: screens[l.target].frame.id,
                navigation: "NAVIGATE",
                transition: {
                  type: "DISSOLVE",
                  easing: { type: "EASE_OUT" },
                  duration: 0.16,
                },
                resetScrollPosition: true,
              },
            ],
      },
    ]);
  }
  for (const [name, { components }] of Object.entries(mainComponents))
    if (name === "Button")
      for (let i = 0; i < components.length; i += 3)
        await components[i].setReactionsAsync([
          {
            trigger: { type: "ON_PRESS" },
            actions: [
              {
                type: "NODE",
                destinationId: components[i + 1].id,
                navigation: "CHANGE_TO",
                transition: {
                  type: "DISSOLVE",
                  easing: { type: "EASE_OUT" },
                  duration: 0.08,
                },
              },
            ],
          },
        ]);
  page.flowStartingPoints = [
    { nodeId: screens["login-client"].frame.id, name: "Acceso · Cliente" },
    { nodeId: screens["login-trainer"].frame.id, name: "Acceso · Entrenador" },
    {
      nodeId: screens["trainer-clients"].frame.id,
      name: "Gestión de clientes",
    },
  ];
  page.selection = [screens["login-client"].frame];
  figma.viewport.scrollAndZoomIntoView([screens["login-client"].frame]);
  return {
    pageId: page.id,
    screenCount: Object.keys(screens).length,
    componentSets: Object.keys(mainComponents).length,
    variableCount: variableIds.length,
    prototypeConnections: links.length,
    createdNodeIds: created,
    collectionIds,
    variableIds,
    screenIds: Object.fromEntries(
      Object.entries(screens).map(([k, v]) => [k, v.frame.id]),
    ),
  };
}
buildFitCoach()
  .then((result) =>
    figma.closePlugin(
      `FitCoach creado: ${result.screenCount} pantallas, ${result.componentSets} familias de componentes y ${result.variableCount} variables.`,
    ),
  )
  .catch((error) =>
    figma.closePlugin("No se ha completado el diseño: " + error.message),
  );
