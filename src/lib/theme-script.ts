// Sin hooks: lo importa el layout (componente de servidor).
export const THEME_KEY = "aeroforo-tema";

/** Se ejecuta antes de pintar la página para que no parpadee el tema equivocado. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){document.documentElement.dataset.theme='light'}})()`;
