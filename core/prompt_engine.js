// core/prompt_engine.js
// Generates image prompts in the FallenOWL "liquid glass" style.
// Three modes:
//   1) built-in template (random object x background)
//   2) curated bank — a hand-authored set of premium pairs (the "embedded model")
//   3) customModelFn — plug any async fn (LLM, ChatGPT, Ollama)
// pin meta (title/description/Boosty link) is ALWAYS attached, in every mode.

const OBJECTS = [
  'a delicate glass feather', 'a clear glass hourglass', 'a translucent glass leaf',
  'a smooth clear glass sphere orb', 'a clear glass compass', 'a translucent glass rose flower',
  'a faceted clear glass crystal gem', 'a single large glass water droplet',
  'a glass seashell', 'a glass ice cube', 'a glass butterfly', 'a glass key',
];
const BACKGROUNDS = [
  'warm beige taupe', 'soft sand beige', 'muted sage grey',
  'moody deep blue grey', 'soft dusty pink beige', 'muted lilac grey', 'warm cream beige',
];

// NOTE: subject-neutral now — the object is supplied per-prompt, not hardcoded.
const STYLE = 'Ultra high quality minimalist iPhone wallpaper, vertical 9:16 aspect ratio. ' +
  'A single translucent clear glass object as the central subject, ' +
  'photorealistic glass material with soft refractions and caustics. ' +
  'Muted desaturated neutral background, lots of negative space, soft cinematic moody lighting, ' +
  'calm elegant premium aesthetic, subtle film grain, crisp 4K detail, no text.';

// === CURATED BANK (the "embedded model": hand-authored by the assistant) ===
// Each entry: object + background + a lighting/mood nuance for variety.
const CURATED = [
  { object: 'a delicate glass feather', background: 'warm cream beige', light: 'soft morning light from upper left, gentle long shadow' },
  { object: 'a clear glass hourglass with flowing glass sand', background: 'moody deep blue grey', light: 'low-key rim light, dramatic single source' },
  { object: 'a translucent glass autumn leaf', background: 'soft dusty pink beige', light: 'diffused overcast light, faint caustics on the surface' },
  { object: 'a smooth clear glass sphere orb', background: 'muted sage grey', light: 'window light casting a crisp refractive caustic pool' },
  { object: 'a clear glass compass with a delicate needle', background: 'warm beige taupe', light: 'warm side light, soft golden caustics' },
  { object: 'a translucent glass rose in full bloom', background: 'soft dusty pink beige', light: 'soft frontal light, dreamy faint glow' },
  { object: 'a faceted glass crystal gem', background: 'moody deep blue grey', light: 'sharp directional light splitting subtle rainbow caustics' },
  { object: 'a single large glass water droplet', background: 'muted lilac grey', light: 'top light with a clean reflective highlight' },
  { object: 'a spiral glass seashell', background: 'soft sand beige', light: 'warm low sun, elongated soft shadow' },
  { object: 'a glass butterfly mid-flight', background: 'warm cream beige', light: 'airy backlight, translucent wing glow' },
  { object: 'an ornate glass key', background: 'muted sage grey', light: 'moody chiaroscuro, single soft spotlight' },
  { object: 'a glass origami crane', background: 'warm terracotta clay', light: 'soft window light from the left, calm shadow' },
  { object: 'a glass maple seed (samara)', background: 'soft sand beige', light: 'gentle diffused light, minimalist negative space' },
  { object: 'a glass crescent moon', background: 'moody deep blue grey', light: 'cool rim light, quiet nocturnal mood' },
  { object: 'a glass dandelion seed head', background: 'warm cream beige', light: 'backlit, delicate translucent filaments' },
  { object: 'a glass mountain peak form', background: 'muted lilac grey', light: 'soft gradient light, serene atmosphere' },
  { object: 'a glass koi fish', background: 'soft dusty pink beige', light: 'fluid caustics, gentle overhead light' },
  { object: 'a glass pine cone', background: 'muted sage grey', light: 'warm directional light, layered refractions' },
  { object: 'a glass paper boat', background: 'warm beige taupe', light: 'soft side light, calm reflective surface' },
  { object: 'a glass hummingbird', background: 'soft sand beige', light: 'bright airy light, crisp wing translucency' },
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function composePrompt(object, background, light) {
  let p = STYLE + ' Subject: ' + object + '. Background: ' + background + '.';
  if (light) p += ' Lighting: ' + light + '.';
  return p;
}

// Built-in random generator
function buildPrompt() {
  const obj = pick(OBJECTS);
  const bg = pick(BACKGROUNDS);
  return { prompt: composePrompt(obj, bg), object: obj, background: bg };
}

// Curated generator (premium hand-authored pairs)
function buildCurated() {
  const c = pick(CURATED);
  return { prompt: composePrompt(c.object, c.background, c.light), object: c.object, background: c.background, light: c.light };
}

// description + alt text for the Pinterest pin (always includes Boosty link)
function buildPinMeta({ object, background }) {
  const objName = (object || 'glass object').replace(/^a |^an /, '');
  const short = objName.replace('glass ', '').replace(/\b\w/, c => c.toUpperCase());
  const title = 'Minimalist iPhone Wallpaper — Liquid Glass ' + short;
  const description = 'Aesthetic ' + objName + ' wallpaper on a ' + (background || 'neutral') +
    ' background. Minimalist liquid-glass iPhone wallpaper in 4K. ' +
    'Get the full pack 👉 boosty.to/fallenowl #wallpaper #iphone #aesthetic #minimalist #liquidglass';
  const alt = 'A translucent ' + objName + ' with refractive light effects centered on a ' +
    (background || 'neutral') + ' background, minimalist vertical iPhone wallpaper';
  return { title, description, alt };
}

// Pluggable generate(). mode: 'curated' (default) | 'random' | customModelFn
async function generate(modeOrFn) {
  let p;
  if (typeof modeOrFn === 'function') {
    p = await modeOrFn({ OBJECTS, BACKGROUNDS, STYLE, composePrompt, CURATED });
  } else if (modeOrFn === 'random') {
    p = buildPrompt();
  } else {
    p = buildCurated();
  }
  // ALWAYS attach pin meta (fixes the missing-Boosty-link bug)
  if (!p.meta) p.meta = buildPinMeta(p);
  return p;
}

module.exports = { generate, buildPrompt, buildCurated, buildPinMeta, composePrompt, OBJECTS, BACKGROUNDS, CURATED, STYLE };