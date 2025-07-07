const audio = document.getElementById('audio');
const progress = document.getElementById('progress');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const lyricsContainer = document.getElementById('lyrics');
const addMarcadorBtn = document.getElementById('add-marcador');
const listaMarcadores = document.getElementById('lista-marcadores');
const capituloLista = document.getElementById('capitulo-lista');
const tituloCapitulo = document.getElementById('titulo-capitulo');

let lyrics = [];
let marcadorCounter = 1;
let capituloActual = "1";

// --- Iniciar
window.addEventListener('load', () => {
  seleccionarCapitulo(capituloActual);
  cargarEventosCapitulos();
});

// --- Capítulos
function cargarEventosCapitulos() {
  capituloLista.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      const cap = li.dataset.capitulo;
      capituloActual = cap;
      seleccionarCapitulo(cap);
    });
  });
}

function seleccionarCapitulo(num) {
  tituloCapitulo.textContent = `Capítulo ${num}`;

  // Cambiar archivo de audio
  audio.src = `audio/capitulo${num}.mp3`;
  audio.load();

  // Cargar letra
  cargarLetra(`letras/capitulo${num}.lrc`);

  // Restaurar progreso
  const lastTime = localStorage.getItem(`cap${num}_ultimaPosicion`);
  audio.currentTime = lastTime ? parseFloat(lastTime) : 0;

  // Cargar marcadores
  listaMarcadores.innerHTML = '';
  cargarMarcadores();

  // Marcar capítulo activo
  capituloLista.querySelectorAll('li').forEach(li => li.classList.remove('active'));
  capituloLista.querySelector(`li[data-capitulo="${num}"]`).classList.add('active');
}

// --- Guardar progreso
window.addEventListener('beforeunload', () => {
  localStorage.setItem(`cap${capituloActual}_ultimaPosicion`, audio.currentTime);
});

// --- Barra de progreso
audio.addEventListener('loadedmetadata', () => {
  progress.max = audio.duration;
  durationEl.textContent = formatearTiempo(audio.duration);
});

audio.addEventListener('timeupdate', () => {
  progress.value = audio.currentTime;
  currentTimeEl.textContent = formatearTiempo(audio.currentTime);
  resaltarLetra(audio.currentTime);
});

progress.addEventListener('input', () => {
  audio.currentTime = progress.value;
});

// --- Formato de tiempo
function formatearTiempo(t) {
  const min = Math.floor(t / 60);
  const sec = Math.floor(t % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

// --- Letras
async function cargarLetra(ruta) {
  try {
    const res = await fetch(ruta);
    const texto = await res.text();
    lyrics = texto.split('\n')
      .filter(linea => /^\[\d+:\d+\.\d+\]/.test(linea))
      .map(linea => {
        const tiempo = parseFloat(linea.match(/\[(\d+):(\d+\.\d+)\]/).slice(1).reduce((a, b) => 60 * a + parseFloat(b)));
        const texto = linea.replace(/\[.*?\]/, '').trim();
        return { tiempo, texto };
      });

    lyricsContainer.innerHTML = '';
    lyrics.forEach(linea => {
      const div = document.createElement('div');
      div.textContent = linea.texto;
      lyricsContainer.appendChild(div);
    });
  } catch (err) {
    lyrics = [];
    lyricsContainer.innerHTML = "<i>No se encontró letra para este capítulo.</i>";
  }
}

function resaltarLetra(currentTime) {
  for (let i = 0; i < lyrics.length; i++) {
    if (currentTime < lyrics[i].tiempo) {
      const items = lyricsContainer.children;
      Array.from(items).forEach(el => el.classList.remove('active'));
      if (i > 0) {
        items[i - 1].classList.add('active');
        items[i - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      break;
    }
  }
}

// --- Marcadores
addMarcadorBtn.addEventListener('click', () => {
  const tiempo = audio.currentTime;
  const nombre = prompt("Nombre del marcador", `Marcador ${marcadorCounter++}`);
  if (nombre) {
    const marcador = { nombre, tiempo };
    guardarMarcador(marcador);
    mostrarMarcador(marcador);
  }
});

function guardarMarcador(marcador) {
  const clave = `cap${capituloActual}_marcadores`;
  const marcadores = JSON.parse(localStorage.getItem(clave) || '[]');
  marcadores.push(marcador);
  localStorage.setItem(clave, JSON.stringify(marcadores));
}

function cargarMarcadores() {
  const clave = `cap${capituloActual}_marcadores`;
  const marcadores = JSON.parse(localStorage.getItem(clave) || '[]');
  marcadores.forEach(m => mostrarMarcador(m));
}

function mostrarMarcador({ nombre, tiempo }) {
  const li = document.createElement('li');
  li.innerHTML = `<strong>${nombre}</strong> - ${formatearTiempo(tiempo)}`;
  li.addEventListener('click', () => {
    audio.currentTime = tiempo;
    audio.play();
  });
  listaMarcadores.appendChild(li);
}
