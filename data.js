'use strict';
/* ALBA DE CENIZA — contenido original del juego.
   Mecánica de cartas inspirada en el sistema de Colostle (Nich Angell);
   mundo, textos y tablas son propios. */

const RANGOS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const PALOS = { S: '♠', C: '♣', H: '♥', D: '♦' };

const CLASES = [
  { id: 'vigia', n: 'Vigía', e: 3, c: 4, ico: '🛡️',
    d: 'Guardianes de los últimos fuegos. Cargan un escudo-brasero: un escudo hueco con una llama que nunca se apaga. Entrenados para resistir, son fuertes en la pelea y firmes al explorar.',
    ideas: ['¿Heredaste el escudo-brasero o lo ganaste en una prueba?', '¿A quién juraste proteger?', '¿Qué pasaría si la llama de tu escudo se apagara?', '¿Por qué abandonaste tu puesto de guardia?'] },
  { id: 'guia', n: 'Guía', e: 5, c: 3, ico: '🧭',
    d: 'Siguen huellas, vientos y rumores. Los acompaña una criatura pequeña de ceniza, mitad mascota y mitad brújula, que huele el peligro antes que ellos. Excelentes exploradores.',
    ideas: ['¿Cómo conociste a tu compañero? ¿Te eligió él a ti?', '¿Tu gente teme a las criaturas de ceniza y tuviste que ocultarlo?', '¿Qué hace especial a tu compañero?', 'En combate, tu compañero ataca contigo: piensa cómo pelea.'] },
  { id: 'alquimista', n: 'Alquimista', e: 2, c: 5, ico: '⚗️',
    d: 'Funden ascuas y ceniza en frascos, bengalas y mechas que estallan. Su fuerza está en el combate; exploran poco porque pasan más tiempo en su taller que en el camino.',
    ideas: ['¿Qué receta te trajo problemas por primera vez?', '¿Prefieres tu taller y saliste a regañadientes?', '¿Alguien te envidia o te teme por lo que sabes hacer?', '¿Qué ingrediente raro andas buscando?'] },
  { id: 'viajante', n: 'Viajante', e: 5, c: 2, ico: '⛵',
    d: 'Cruzan el Mar de Ceniza en trineos de vela o carros de ruedas altas que ellos mismos arman con restos. Su vehículo es su casa y su libertad. Exploran de maravilla, pero empiezan con poca pelea.',
    ideas: ['Describe tu vehículo y el arma que lleva a bordo.', '¿Vienes de una familia de caravaneros?', '¿Qué pieza te falta para mejorarlo?', '¿Qué dejaste atrás para salir al camino?'] }
];

/* Se reparten por carta: A/2, 3/4, 5/6, 7/8, 9/10, J/Q, K */
const LLAMADOS = [
  { t: 'El pueblo sin sombras', x: 'Una mañana toda tu aldea despertó sin sombra: ni las personas, ni los árboles, ni las casas. Todas menos la tuya, que te sigue como siempre y que últimamente parece señalar hacia un lugar. Alguien se las llevó, y solo tú puedes seguirles el rastro.' },
  { t: 'Las campanas que callaron', x: 'Las campanas del alba de tu aldea dejaron de sonar el mismo día que las de todo el mundo. Eres la única que notó que el silencio avanza siguiendo una ruta, como un animal. Quieres saber qué lo guía y cómo detenerlo.' },
  { t: 'El mapa tatuado', x: 'Despertaste un día con un mapa dibujado en la espalda. Se completa un poquito cada vez que cruzas una frontera. No sabes quién lo hizo, ni cuándo, ni hacia dónde lleva. Solo sabes que no te duele y que, a veces, brilla.' },
  { t: 'La deuda del viajero', x: 'Hace años un viajero herido llegó a tu puerta. Murió en tu casa dejándote un colgante y una promesa: encontrar a su hermana, en una ciudad que ya nadie visita. Hoy el colgante se calienta cada vez que miras hacia el norte.' },
  { t: 'El frasco del desván', x: 'En el desván de tu abuela encontraste un frasco con una luz diminuta que habla. Dice ser el último pedazo de un día olvidado, y te pide que lo lleves de vuelta a su lugar. No recuerda cuál es. Se pone muy triste cuando intenta recordarlo.' },
  { t: 'La afinadora', x: 'Eres la última aprendiz de un oficio que nadie recuerda: afinar las campanas del alba. Tu maestra desapareció dejándote una campana sin badajo y una nota: "Búscalo donde cantó la primera vez". Sin ese badajo, nada de lo que repares sonará bien.' },
  { t: 'El sorteo', x: 'En tu aldea, cada año, una persona sale al mundo a buscar la manera de devolver el sol. Esta vez tu nombre salió de la urna, y no estás segura de si fue casualidad. Tu gente te despidió en silencio. Prometiste volver con algo de luz.' }
];

const NATURALEZAS = [
  'Cálida y generosa: reparte lo poco que tiene y no sabe decir que no.',
  'Desconfiada y práctica: cuenta las monedas dos veces y las salidas tres.',
  'Curiosa hasta la imprudencia: abre todas las puertas y toca todas las palancas.',
  'Orgullosa y leal: jamás rompe una promesa, aunque le cueste caro.',
  'Soñadora y distraída: se pierde mirando el cielo gris y a veces se ríe sola.',
  'Terca como una piedra: una vez que decide algo, nadie la mueve.',
  'Bromista incluso en el peligro: la risa es su manera de no tener miedo.'
];

/* ---------- EXPLORACIÓN: cartas ROJAS = seres; cartas NEGRAS = lugares y cosas ---------- */
/* Acciones: [tipo, etiqueta, parámetro] */

const EXP_ROJO = {
  1: { t: 'La farolera errante', d: 'Una mujer encorvada arrastra un carrito con cientos de lámparas diminutas, cada una con una llama de color distinto. Asegura que vende recuerdos.',
    H: { l: 'Generosa', x: 'Te regala una lámpara y una historia. Anótala en tu diario.', a: [['giveItem', 'Aceptar la lámpara', 'Lámpara de recuerdos']] },
    D: { l: 'Cobra caro', x: 'Pide algo a cambio de su luz: un secreto tuyo o un objeto. Si te niegas, la cosa se pone fea.', a: [['loseItem', 'Pagar con un objeto'], ['fight', 'Negarte y luchar', 'person']] } },
  2: { t: 'Un animal imposible', d: 'Piel de ceniza prensada, ojos como brasas casi apagadas. Podría ser comida, podría ser el guardián de algo.',
    H: { l: 'Manso', x: 'Puedes cazarlo o intentar ganarte su confianza.', a: [['giveItem', 'Cazarlo (Provisiones)', 'Provisiones'], ['giveItem', 'Ganarte su confianza (compañero)', 'Animal manso']] },
    D: { l: 'Fiera', x: 'Te vio antes de que lo vieras. Puedes enfrentarlo o rodearlo despacio.', a: [['fight', 'Enfrentarlo', 'fiera'], ['avoid', 'Rodearlo despacio']] } },
  3: { t: 'Tu Llamado', d: 'Alguien o algo ligado a tu Llamado cruza tu camino. Relee tu ficha y piensa qué significa.', call: true,
    H: { l: 'Aliado', x: 'Ofrece una pista o ayuda sincera.', a: [['pista', 'Anotar la pista']] },
    D: { l: 'Obstáculo', x: 'Quiere frenarte o esconderte la verdad. Puedes convencerle o luchar.', a: [['pista', 'Convencerle y anotar la pista'], ['fight', 'Luchar contra una persona', 'person']] } },
  4: { t: 'El cantor de deudas', d: 'Un hombre con un laúd de tres cuerdas te propone un trato: te acompaña un trecho a cambio de que lo escuches cantar todas sus penas.',
    H: { l: 'Sincero', x: 'Su canción esconde un rumor útil.', a: [['item', 'Pedir un obsequio (Objeto)']] },
    D: { l: 'Distrae', x: 'Mientras cantas con él, sus cómplices te rodean.', a: [['fight', 'Luchar contra una persona', 'person']] } },
  5: { t: 'La pastora de humo', d: 'Un rebaño de criaturas hechas de humo espeso pasta sobre la ceniza, guiado por una pastora con un cayado de hueso.',
    H: { l: 'Pacífica', x: 'Te indica el mejor camino.', a: [['event', 'Preguntar por el camino (Evento)']] },
    D: { l: 'Territorial', x: 'Cree que vienes a robarle el rebaño.', a: [['fight', 'Defenderte', 'person'], ['avoid', 'Rodear el rebaño']] } },
  6: { t: 'El duelista sin rival', d: 'Una figura con dos espadas rotas te sale al paso. Lleva años buscando alguien que lo derrote.',
    H: { l: 'Duelo amistoso', x: 'Es un duelo de práctica: cuenta cómo se miden. Si sales airosa, te regala algo.', a: [['item', 'Recibir su regalo (Objeto)']] },
    D: { l: 'A muerte', x: 'Para él no es un juego.', a: [['fight', 'Aceptar el duelo', 'person'], ['avoid', 'Retirarte con dignidad']] } },
  7: { t: 'El cielo se agrieta', d: 'Una grieta de luz cruza el cielo gris y por ella cae un vendaval de aves de ceniza que te levantan del suelo.',
    H: { l: 'Te dejan lejos', x: 'Aterrizas en otra región, muy lejos de donde estabas. Cuenta cómo llegas.', a: [] },
    D: { l: 'Te sueltan en un pozo', x: 'Caes en un agujero profundo. Pierdes tiempo y quizá algo más. Cuenta cómo sales.', a: [['event', 'Ver qué hay abajo (Evento)']] } },
  8: { t: 'Campamento de caravaneros', d: 'Carros de ruedas altas en círculo, fogatas y niños que corren entre las cuerdas.',
    H: { l: 'Hospitalarios', x: 'Te ofrecen sitio junto al fuego. Puedes comerciar.', a: [['item', 'Comerciar (Objeto)']] },
    D: { l: 'Con problemas', x: 'Algo les pasa y no te lo dicen.', a: [['event', 'Ver qué ocurre (Evento)']] } },
  9: { t: 'El esqueleto del tamaño de una casa', d: 'Costillas como arcos de puente, con liquen apagado. ¿De qué criatura era? ¿Qué fue lo que la mató?',
    H: { l: 'Nada se mueve', x: 'Puedes registrar los huesos con calma.', a: [['item', 'Registrar los huesos (Objeto)']] },
    D: { l: 'Alguien lo habita', x: 'Entre las costillas hay un hogar de alguien.', a: [['event', 'Ver quién lo habita (Evento)']] } },
  10: { t: 'Gente sin rostro', d: 'Figuras encapuchadas caminan en fila. Dentro de las capuchas no hay caras, solo una oscuridad tibia.',
    H: { l: 'No te notan', x: 'Pasan de largo. ¿Los sigues o los dejas ir?', a: [] },
    D: { l: 'Te invitan a un banquete que no acaba', x: 'No aceptan un no. Cuenta cómo escapas o qué te piden a cambio.', a: [['event', 'Ver cómo escapas (Evento)']] } }
};

const EXP_NEGRO = {
  1: { t: 'Un altar de ofrendas', d: 'Cera derretida, flores secas y, en el centro, un objeto que parece tibio. Quien lo dejó aquí pedía algo.',
    S: { l: 'Intacto', x: 'Sumas 1 punto a Exploración o a Combate (máximo 5).', a: [['score', 'Tomar la ofrenda (+1 punto)']] },
    C: { l: 'Revuelto', x: 'Alguien llegó antes. Solo queda un objeto.', a: [['item', 'Buscar entre los restos (Objeto)']] } },
  2: { t: 'Un molino de aspas', d: 'Una estructura enorme de madera ennegrecida, con aspas que crujen contra el viento.',
    S: { l: 'Aún gira', x: 'Desde arriba se ve mucho terreno. Anota lo que ves.', a: [['pista', 'Anotar lo que ves (pista)']] },
    C: { l: 'Destrozado', x: 'Solo quedan engranajes sueltos.', a: [['giveItem', 'Recoger un engranaje', 'Pieza de mecanismo']] } },
  3: { t: 'Torre de vigía', d: 'Una torre de piedra, vacía, con una linterna en lo alto que lleva siglos sin encender.',
    S: { l: 'En pie', x: 'Puedes subir. Desde la cima se ve todo.', a: [['pista', 'Subir y anotar la pista']] },
    C: { l: 'Derruida', x: 'Entre los escombros hay algo.', a: [['item', 'Revolver los escombros (Objeto)']] } },
  4: { t: 'Aldea vacía', d: 'Puertas abiertas, mesas puestas, platos con restos de comida seca. Nadie.',
    S: { l: 'Casas en pie', x: 'Puedes entrar a mirar.', a: [['item', 'Buscar en las casas (Objeto)']] },
    C: { l: 'Algo está mal', x: 'Hay marcas y arañazos por todas partes.', a: [['event', 'Ver qué ocurre (Evento)']] } },
  5: { t: 'Un Faro', d: 'Una torre de cristal ahumado, mitad edificio y mitad lámpara, clavada en el paisaje. Se dice que cinco faros encendidos devolverían el alba.',
    S: { l: 'Reavivable', x: 'Con ingenio o esfuerzo puedes volver a encenderlo. Describe cómo.', a: [['fragment', 'Encender el Faro (+1 Fragmento de Alba)']] },
    C: { l: 'Apagado y roto', x: 'Para repararlo necesitas una Llave o una Pieza de mecanismo en tu inventario.', a: [['faroRepair', 'Reparar el Faro (gasta Llave o Pieza)']] } },
  6: { t: 'Niebla de espejismos', d: 'Ves frente a ti lo que más deseas: agua limpia, tu casa, a alguien querido.',
    S: { l: 'Lo notas a tiempo', x: 'Cierras los ojos y sigues. Cuenta qué viste.', a: [] },
    C: { l: 'Te lleva a la caída', x: 'Pierdes el rumbo y el equilibrio.', a: [['loseItem', 'Perder un objeto'], ['wound1', 'Sufrir 1 herida']] } },
  7: { t: 'Un puente colgante', d: 'Cuerdas y tablas sobre un abismo sin fondo visible. Del otro lado, algo que parece un camino.',
    S: { l: 'Firme', x: 'Cruzas sin problema. Cuenta cómo se siente.', a: [] },
    C: { l: 'Podrido', x: 'Cruzar es una apuesta.', a: [['wound1', 'Cruzar igual (1 herida)'], ['avoid', 'Buscar otro paso']] } },
  8: { t: 'El borde del Mar de Ceniza', d: 'Dunas finas y olas lentas de polvo gris que se pierden en el horizonte. Quizá puedas cruzarlo.',
    S: { l: 'Calma', x: 'El mar está en paz. Cruzarlo es posible si tienes con qué.', a: [] },
    C: { l: 'Tormenta de polvo', x: 'El horizonte ruge.', a: [['weather', 'Tirar el clima']] } },
  9: { t: 'Lo que buscabas', d: 'Llegas a un lugar clave para tu Llamado: un edificio con una pista, o uno de los sitios que perseguías.', call: true,
    S: { l: 'Es el lugar', x: 'Avanzas de verdad: ganas 1 Fragmento de Alba.', a: [['fragment', 'Reclamar el Fragmento de Alba']] },
    C: { l: 'Una pista hacia el siguiente paso', x: 'Anótala en tu diario.', a: [['pista', 'Anotar la pista']] } },
  10: { t: 'Una ciudad de lámparas', d: 'Puentes y escaleras levantados sobre una ladera, farolillos colgando de cuerdas, mercados y forjas.',
    S: { l: 'Próspera', x: 'Puedes entrar y usar sus servicios.', a: [['city', 'Entrar en la ciudad']] },
    C: { l: 'Abandonada', x: 'Calles vacías y puertas abiertas. Algo queda por encontrar.', a: [['item', 'Registrar la ciudad (Objeto)'], ['event', 'Ver qué ocurre (Evento)']] } }
};

const FIGURA = {
  11: { t: 'Un hallazgo', d: 'Algo brilla a un lado del camino. ¿Quién lo dejó ahí?', a: [['item', 'Recoger el hallazgo (Objeto)']] },
  12: { t: 'Un Centinela de Ceniza', d: 'Una figura de piedra del tamaño de una carreta, de pasos pesados y ojos sin pupila. Está ahí, quieto, esperando.', a: [['fight', 'Luchar contra el Centinela', 'medium'], ['avoid', 'Pasar de largo con sigilo']] },
  13: { t: 'Un Coloso de Ceniza', d: 'Una mole del tamaño de una casa grande, con balcones y almenas en el lomo. Su sombra te cubre entera.', a: [['fight', 'Luchar contra el Coloso', 'massive'], ['avoid', 'Pasar de largo con sigilo']] }
};

/* Rango 1..13 */
const ITEMS = [
  null,
  { n: 'Un Tesoro', k: 'tesoro', v: 1, d: 'Una pepita de brasa. Sirve para comerciar.' },
  { n: 'Hierbas curativas', k: 'cura', d: 'Prepáralas y cura 1 herida.' },
  { n: 'Cuerda con garfio', k: 'misc', d: 'Para trepar, colgarse y atar casi todo.' },
  { n: 'Mapa chamuscado', k: 'misc', d: 'Muestra una zona nueva. Anótala.' },
  { n: 'Frasco sin etiqueta', k: 'misc', d: '¿Un remedio? ¿Un veneno? Tú decides qué hace.' },
  { n: 'Llave de bronce', k: 'llave', d: 'Abre algo, en algún sitio.' },
  { n: 'Pieza de mecanismo', k: 'pieza', d: 'Engranajes, resortes o algo más raro.' },
  { n: 'Un rumor', k: 'saber', d: 'Apúntalo en tu diario: es una pista.' },
  { n: 'Animal manso', k: 'compañero', d: 'Te sigue y no muerde.' },
  { n: 'Provisiones para tres días', k: 'misc', d: 'Alivian el hambre.' },
  { n: 'Herramienta inusual', k: 'arma', d: 'Invéntala tú: puede servir también como arma.' },
  { n: 'Reliquia de otra época', k: 'misc', d: 'Parece valiosa... o maldita.' },
  { n: 'Dos Tesoros', k: 'tesoro', v: 2, d: 'Dos pepitas de brasa. Sirven para comerciar.' }
];

const EVENTOS = [
  null,
  'Un animal curioso te sigue desde hace un rato.',
  'Una ráfaga de ceniza te ciega un instante; todo se vuelve gris.',
  'Oyes cantar a lo lejos, sin ver a nadie.',
  'El suelo cede un poco bajo tus pies.',
  'Encuentras señales de un campamento reciente, aún tibio.',
  'Algo de tu equipo se estropea.',
  'Cae la noche (o amanece) de golpe, sin crepúsculo.',
  'Sientes que alguien te sigue.',
  'Un trueno seco sacude la llanura.',
  'Algo te bloquea el paso: un derrumbe, una cerca, una criatura.',
  'Un viajero te cuenta algo que parece importante.',
  'Tu sombra (o tu compañero) se comporta de forma extraña.',
  'Un golpe de suerte: algo sale a tu favor. Cuéntalo.'
];

const CLIMA = [
  null,
  'Un rayo de sol atraviesa la bruma: ganas +1 temporal a Exploración o Combate este capítulo.',
  'Viento de cola: avanzas deprisa hacia donde quieres ir.',
  'Hollín en suspensión: la visibilidad es de apenas unos pasos.',
  'Lluvia de cenizas finas: no hay dónde resguardarse.',
  'Calma sofocante: no avanzas nada hasta mañana.',
  'Corriente cruzada: te desvías y pierdes un día.',
  'Copos grises: empieza a hacer mucho frío.',
  'Un torbellino de polvo avanza hacia ti.',
  'Tormenta de polvo cerrada: todo tiembla.',
  'Relámpagos secos iluminan la llanura.',
  'Una costra de vidrio se forma bajo tus pies: quedas atrapada un día.',
  'Una ola de ceniza se alza sobre tu cabeza. ¿La esquivas o la montas?',
  'El suelo se hunde: despiertas en un lugar nuevo y no recuerdas cómo llegaste.'
];

const COMPANEROS = [
  'Un zorro de ceniza con la cola encendida',
  'Un lagarto de cristal que cambia de color',
  'Un pájaro sin plumas, de hueso y tela',
  'Una esfera que rueda y canta',
  'Un perro cojo hecho de humo',
  'Un gato que camina por las paredes',
  'Una salamandra con ojos de linterna',
  'Un cangrejo con caparazón de campana',
  'Una mariposa enorme que deja rastro de luz',
  'Un tejón de ceniza con carácter de herrero',
  'Una polilla flotante del tamaño de un escudo',
  'Una criatura con una puertecilla en el costado',
  'Una criatura pequeña que murmura palabras de un idioma perdido'
];

/* ---------- COMBATE ---------- */
const INTENCION = {
  S: 'Defender su territorio a muerte',
  C: 'Quitarte lo que llevas',
  H: 'Escapar de algo, usándote como escudo',
  D: 'Ponerte a prueba: quiere que lo venzas con ingenio'
};
const DON = {
  S: { n: 'Sin don', t: 'No usa magia; ataca solo con su cuerpo.' },
  C: { n: 'Humo', t: 'Nubes de hollín que ciegan y ahogan.' },
  H: { n: 'Brasa', t: 'Chorros de fuego y lluvias de ascuas.' },
  D: { n: 'Eco', t: 'Ondas de sonido que aturden y rompen piedra.' }
};
const RECOMPENSA = {
  S: { n: 'Un arma', t: 'Un arma nueva, hecha con sus restos. Describe cómo es.' },
  C: { n: 'Una cría', t: 'Una criatura de ceniza pequeña, que ahora te sigue como compañero.' },
  H: { n: 'Un miembro', t: 'Un brazo, una pierna o una cola mecánica que puedes acoplar a tu equipo.' },
  D: { n: 'Un núcleo', t: 'Un núcleo con el don del Centinela: úsalo para dar fuerza a tus ataques mágicos.' }
};
const FORMA = [
  'una armadura vacía con ojos de brasa',
  'una torre con patas de araña',
  'un buey de piedra con cuernos de hierro',
  'un barril con brazos largos y delgados',
  'un gigante sin cabeza que camina inclinado',
  'una campana colosal que rueda',
  'un caracol de piedra con una torre en la concha',
  'una estatua con las manos tapándole la cara',
  'un cangrejo de ladrillos con pinzas de grúa',
  'un pájaro cojo del tamaño de una casa',
  'un escudo enorme con dos piernas',
  'un molino que camina',
  'un guerrero sentado que se levanta con esfuerzo'
];
const ATAQUE_ENEMIGO = {
  S: 'un golpe directo con el cuerpo',
  C: 'un ataque con su arma',
  H: 'un ataque con su don (o, si no tiene, un golpe con toda su fuerza)',
  D: 'una maniobra astuta o inesperada'
};
const ATAQUE_JUGADOR = {
  S: 'Ataque con el cuerpo',
  C: 'Ataque con tu arma',
  H: 'Ataque con tu don, tu compañero o tu habilidad de clase',
  D: 'Ataque creativo: improvisa algo distinto'
};

const BIBLIO = [
  'Una archivista te enseña un grabado donde aparece algo de tu Llamado, con un detalle que no esperabas.',
  'Entre dos libros hay una carta que nadie recogió: nombra a alguien que podría ayudarte.',
  'Un mapa antiguo marca, con tinta que parece fresca, un lugar relacionado con lo que buscas.',
  'Un anciano que duerme sobre los libros murmura una frase. Anótala: es una pista.',
  'Descubres que alguien consultó estos mismos archivos poco antes que tú.',
  'No hay nada útil... salvo una página arrancada. ¿Quién la quería?'
];

const SHOP = [
  { id: 'coraza', n: 'Coraza de ceniza prensada', p: 5, k: 'armor', d: 'Bloquea 1 herida en cada combate.' },
  { id: 'planeador', n: 'Planeador de tela', p: 3, k: 'misc', d: 'Para lanzarte desde las alturas.' },
  { id: 'garfio', n: 'Garfio y cuerda larga', p: 1, k: 'misc', d: 'Para trepar y colgarse de todo.' },
  { id: 'lente', n: 'Lente del farero', p: 3, k: 'misc', d: 'Permite ver los Faros a lo lejos, incluso entre el hollín.' },
  { id: 'campanilla', n: 'Campanilla de aviso', p: 2, k: 'misc', d: 'Suena cuando algo grande se acerca.' },
  { id: 'llave', n: 'Llave de bronce', p: 2, k: 'llave', d: 'Abre algo, en algún sitio.' },
  { id: 'pieza', n: 'Pieza de mecanismo', p: 2, k: 'pieza', d: 'Sirve para reparar Faros y máquinas.' },
  { id: 'hierbas', n: 'Hierbas curativas', p: 2, k: 'cura', d: 'Curan 1 herida.' }
];

const CITY_NAMES = ['Brasaluz', 'Hollinar', 'Vigía Alta', 'Puente Roto', 'Faroblanco', 'Costa Gris', 'Telar de Humo', 'Ocaso', 'Rescoldo', 'Almenar', 'Cinérea', 'Ventisca'];

const NOCHE = {
  t: 'La Noche Larga', type: 'massive',
  d: 'Los Faros arden a la vez y la oscuridad, que llevaba siglos acumulándose, se reúne frente a ti en la Cumbre del Alba. Tiene la forma de lo que más temes. No quiere que el sol vuelva.'
};
const FINAL_TXT = NOCHE.d;
const END_TXT = 'La Noche Larga se rompe en mil esquirlas de sombra y, por primera vez en siglos, una línea de luz dorada se asoma por el horizonte. El Mar de Ceniza se tiñe de oro. Abajo, en las aldeas, alguien abre una ventana. Has devuelto el alba. Escribe la última página de tu diario: tu aventura puede continuar, o puedes dejarla aquí, en lo más alto.';
