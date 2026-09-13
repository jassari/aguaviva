/* ==========================================================================
   AGUA VIVA · LIVING — ANIMACIONES (script.js)
   ==========================================================================
   Este archivo solo se encarga de MOVIMIENTO. No cambia contenido ni
   estructura — únicamente añade y quita clases CSS en el momento correcto.
   Toda la apariencia de cada estado vive en styles.css, sección 12.

   Índice:
     1. Secuencia de entrada de la portada
     2. Revelado de contenido al hacer scroll (con retraso escalonado)
     3. Conteo animado de las cifras de "Filosofía"
     4. Encabezado que se oculta/aparece según la dirección del scroll
     5. Punto que sigue al cursor
   ========================================================================== */

document.addEventListener("DOMContentLoaded", function () {

  var prefiereMenosMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     1. SECUENCIA DE ENTRADA DE LA PORTADA
     Añadimos la clase "hero--listo" al <body> apenas carga la página.
     styles.css usa esa clase para animar la imagen, el velo y el texto
     del hero en cascada (ver variables --retraso / transition-delay).
     ------------------------------------------------------------------ */
  window.requestAnimationFrame(function () {
    document.body.classList.add("hero--listo");
  });


  /* ------------------------------------------------------------------
     2. REVELADO AL HACER SCROLL
     Cualquier elemento con el atributo data-reveal se observa con
     IntersectionObserver. Cuando entra en pantalla, se le añade la
     clase "es-visible" y su transición (definida en CSS) lo anima.

     El retraso escalonado entre "hermanos" (por ejemplo, las tres
     tarjetas de Experiencia) se calcula aquí según su posición dentro
     del mismo contenedor, para que aparezcan uno tras otro en vez de
     todos a la vez.
     ------------------------------------------------------------------ */
  var elementosRevelados = document.querySelectorAll("[data-reveal]");

  elementosRevelados.forEach(function (el) {
    var hermanos = Array.prototype.slice.call(el.parentElement.children)
      .filter(function (hijo) { return hijo.hasAttribute("data-reveal"); });
    var posicion = hermanos.indexOf(el);
    var retraso = Math.min(posicion * 0.12, 0.6); // tope de 0.6s para que no se sienta lento
    el.style.setProperty("--retraso", retraso + "s");
  });

  if (prefiereMenosMovimiento) {
    // Si el usuario prefiere menos movimiento, mostramos todo de una vez.
    elementosRevelados.forEach(function (el) { el.classList.add("es-visible"); });
  } else if ("IntersectionObserver" in window) {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("es-visible");
          observador.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });

    elementosRevelados.forEach(function (el) { observador.observe(el); });
  } else {
    // Navegador muy antiguo sin soporte: mostrar todo directamente.
    elementosRevelados.forEach(function (el) { el.classList.add("es-visible"); });
  }


  /* ------------------------------------------------------------------
     3. CONTEO ANIMADO DE LAS CIFRAS
     Las cifras de la sección "Filosofía" ya tienen su valor final escrito
     en el HTML (para que se vean bien incluso sin JavaScript). Cuando la
     sección entra en pantalla, las reemplazamos temporalmente por un
     conteo desde 0 hasta ese valor.
     ------------------------------------------------------------------ */
  var cifras = document.querySelectorAll(".cifra__numero");

  function animarCifra(elemento) {
    var textoFinal = elemento.textContent.trim();
    var numero = parseInt(textoFinal.replace(/[^0-9]/g, ""), 10);

    if (isNaN(numero) || prefiereMenosMovimiento) return;

    var prefijo = textoFinal.match(/^\D*/)[0];  // ej: "+"
    var sufijo = textoFinal.match(/\D*$/)[0];   // ej: "%"
    var duracion = 1200;
    var inicio = null;

    function paso(marcaDeTiempo) {
      if (!inicio) inicio = marcaDeTiempo;
      var avance = Math.min((marcaDeTiempo - inicio) / duracion, 1);
      var valorActual = Math.floor(avance * numero);
      elemento.textContent = prefijo + valorActual + sufijo;
      if (avance < 1) {
        window.requestAnimationFrame(paso);
      } else {
        elemento.textContent = textoFinal; // aseguramos el valor exacto al final
      }
    }
    window.requestAnimationFrame(paso);
  }

  if (cifras.length && "IntersectionObserver" in window && !prefiereMenosMovimiento) {
    var observadorCifras = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          animarCifra(entrada.target);
          observadorCifras.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.6 });

    cifras.forEach(function (el) { observadorCifras.observe(el); });
  }


  /* ------------------------------------------------------------------
     4. ENCABEZADO SEGÚN DIRECCIÓN DEL SCROLL
     - Al bajar: el encabezado se oculta (más espacio para el contenido).
     - Al subir: reaparece de inmediato, con fondo sólido para que el
       texto siga siendo legible sobre cualquier sección.
     - Cerca del tope de la página: siempre visible, sin fondo (como en
       la portada).
     ------------------------------------------------------------------ */
  var encabezado = document.querySelector(".encabezado");
  var ultimaPosicion = window.scrollY;
  var alturaVentana = window.innerHeight;

  function alScrollear() {
    var posicionActual = window.scrollY;
    var bajando = posicionActual > ultimaPosicion;

    if (posicionActual < alturaVentana * 0.6) {
      encabezado.classList.remove("encabezado--fijo", "encabezado--oculto");
    } else {
      encabezado.classList.add("encabezado--fijo");
      encabezado.classList.toggle("encabezado--oculto", bajando && posicionActual > ultimaPosicion + 4);
      if (!bajando) encabezado.classList.remove("encabezado--oculto");
    }

    ultimaPosicion = posicionActual;
  }

  window.addEventListener("scroll", alScrollear, { passive: true });


  /* ------------------------------------------------------------------
     5. PUNTO QUE SIGUE AL CURSOR
     Un detalle sutil: un pequeño punto sigue el cursor con una leve
     inercia, y crece al pasar sobre enlaces o botones. Se desactiva
     solo en pantallas táctiles (ver media query "hover: none" en CSS)
     y si el usuario prefiere menos movimiento.
     ------------------------------------------------------------------ */
  var esTactil = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  if (!esTactil && !prefiereMenosMovimiento) {
    var cursor = document.createElement("div");
    cursor.className = "cursor";
    document.body.appendChild(cursor);

    var objetivoX = 0, objetivoY = 0, actualX = 0, actualY = 0;

    window.addEventListener("mousemove", function (evento) {
      objetivoX = evento.clientX;
      objetivoY = evento.clientY;
      cursor.classList.add("cursor--activo");
    });

    function seguirCursor() {
      // Suavizado simple: el punto persigue al cursor real con un poco de retraso.
      actualX += (objetivoX - actualX) * 0.18;
      actualY += (objetivoY - actualY) * 0.18;
      cursor.style.left = actualX + "px";
      cursor.style.top = actualY + "px";
      window.requestAnimationFrame(seguirCursor);
    }
    window.requestAnimationFrame(seguirCursor);

    var elementosInteractivos = document.querySelectorAll("a, button, input, textarea");
    elementosInteractivos.forEach(function (el) {
      el.addEventListener("mouseenter", function () { cursor.classList.add("cursor--grande"); });
      el.addEventListener("mouseleave", function () { cursor.classList.remove("cursor--grande"); });
    });
  }

});
