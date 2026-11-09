let lienzo, ctx;
let cantidadNodos = 8;
let nombresNodos = [];
let aristas = [];
let posicionesNodos = [];

let pasosDijkstra = [];
let indicePasoActual = 0;
let indiceInicio = 0;
let indiceFin = 0;

window.onload = () => {
    lienzo = document.getElementById('lienzoGrafo');
    ctx = lienzo.getContext('2d');
    redimensionarLienzo();
    window.addEventListener('resize', redimensionarLienzo);
    inicializarGrafo();
};

function redimensionarLienzo() {
    const contenedor = lienzo.parentElement;
    lienzo.width = contenedor.clientWidth;
    lienzo.height = contenedor.clientHeight;
    calcularPosiciones();
    if (pasosDijkstra.length > 0) renderizarPaso();
    else dibujarGrafo();
}

function calcularPosiciones() {
    posicionesNodos = [];
    const centroX = lienzo.width / 2 || 300;
    const centroY = lienzo.height / 2 || 200;
    const radio = Math.max(Math.min(centroX, centroY) - 60, 60);
    for (let i = 0; i < cantidadNodos; i++) {
        const angulo = (i * 2 * Math.PI) / cantidadNodos - Math.PI / 2;
        posicionesNodos.push({
            x: centroX + radio * Math.cos(angulo),
            y: centroY + radio * Math.sin(angulo)
        });
    }
}

function alternarModoGeneracion() {
    const modo = document.getElementById('tipoGeneracion').value;
    document.getElementById('panelManual').style.display = modo === 'manual' ? 'flex' : 'none';
    inicializarGrafo();
}

function inicializarGrafo() {
    const valor = Number(document.getElementById('numeroNodos').value);
    if (Number.isInteger(valor) && valor >= 7 && valor <= 16) {
        cantidadNodos = valor;
    } else {
        alert("Por favor ingrese un número entero n entre 7 y 16.");
        return;
    }

    nombresNodos = Array.from({length: cantidadNodos}, (_, i) => String.fromCharCode(65 + i));
    calcularPosiciones();

    aristas = [];
    if (document.getElementById('tipoGeneracion').value === 'aleatorio') {
        generarGrafoAleatorioSinCiclos();
    }

    poblarDesplegables();
    reiniciarInterfazDijkstra();
    renderizarListaAristas();
    dibujarGrafo();
}

function generarGrafoAleatorioSinCiclos() {
    aristas = [];
    const prob = cantidadNodos <= 9 ? 0.5 : cantidadNodos <= 12 ? 0.35 : 0.27;
    for (let i = 0; i < cantidadNodos; i++) {
        for (let j = i + 1; j < cantidadNodos; j++) {
            if (Math.random() < prob || j === i + 1) {
                aristas.push({ origen: i, destino: j, peso: Math.floor(Math.random() * 12) + 1 });
            }
        }
    }
}

function generaCiclo(origen, destino) {
    if (origen === destino) return true;
    let visitados = Array(cantidadNodos).fill(false);
    let cola = [destino];
    visitados[destino] = true;
    while (cola.length > 0) {
        let actual = cola.shift();
        if (actual === origen) return true;
        aristas.forEach(e => {
            if (e.origen === actual && !visitados[e.destino]) {
                visitados[e.destino] = true;
                cola.push(e.destino);
            }
        });
    }
    return false;
}

function agregarAristaManual() {
    const u = parseInt(document.getElementById('aristaOrigen').value);
    const v = parseInt(document.getElementById('aristaDestino').value);
    const w = Number(document.getElementById('aristaPeso').value);

    if (!Number.isInteger(w) || w <= 0) {
        alert("Ingrese un peso entero mayor a 0.");
        return;
    }
    if (u === v) {
        alert("No se permiten bucles en el mismo nodo.");
        return;
    }
    if (aristas.some(e => e.origen === u && e.destino === v)) {
        alert("La arista entre estos nodos ya existe.");
        return;
    }
    if (generaCiclo(u, v)) {
        alert(`¡ERROR! La arista (${nombresNodos[u]} → ${nombresNodos[v]}) genera un ciclo en el grafo. El grafo debe ser Dirigido y Sin Ciclos.`);
        return;
    }

    aristas.push({ origen: u, destino: v, peso: w });
    reiniciarInterfazDijkstra();
    renderizarListaAristas();
    dibujarGrafo();
}

function eliminarArista(i) {
    aristas.splice(i, 1);
    reiniciarInterfazDijkstra();
    renderizarListaAristas();
    dibujarGrafo();
}

function limpiarAristas() {
    aristas = [];
    reiniciarInterfazDijkstra();
    renderizarListaAristas();
    dibujarGrafo();
}

function renderizarListaAristas() {
    const cont = document.getElementById('listaAristas');
    if (!cont) return;
    if (aristas.length === 0) {
        cont.innerHTML = '<p class="texto-atenuado">Aún no hay aristas.</p>';
        return;
    }
    cont.innerHTML = aristas.map((a, i) =>
        `<div class="item-arista"><span>${nombresNodos[a.origen]} → ${nombresNodos[a.destino]} (peso ${a.peso})</span>` +
        `<button class="boton-mini" onclick="eliminarArista(${i})">✕</button></div>`
    ).join('');
}

function poblarDesplegables() {
    const ids = ['nodoInicio', 'nodoFin', 'aristaOrigen', 'aristaDestino'];
    const sels = ids.map(id => document.getElementById(id));
    sels.forEach(sel => sel.innerHTML = nombresNodos.map((n, i) => `<option value="${i}">${n}</option>`).join(''));
    document.getElementById('nodoFin').value = cantidadNodos - 1;
    document.getElementById('aristaDestino').value = 1;
}

function reiniciarInterfazDijkstra() {
    document.getElementById('panelControl').style.display = 'none';
    document.getElementById('resultadosResumen').style.display = 'none';
    document.getElementById('descripcionPaso').innerHTML = 'Haz clic en "Siguiente Paso" para avanzar en el recorrido.';
    document.getElementById('contenedorTabla').innerHTML = '<p class="texto-atenuado">Genera el grafo e inicia el algoritmo para ver las etiquetas.</p>';
    pasosDijkstra = [];
    indicePasoActual = 0;
}

function reiniciarEjecucion() {
    indicePasoActual = 0;
    renderizarPaso();
}

function irAlFinal() {
    indicePasoActual = pasosDijkstra.length - 1;
    renderizarPaso();
}

/* ---------------- DIBUJO ---------------- */

function dibujarGrafo(nodoActivo = -1, nodosVisitados = [], caminos = [], aristasRes = [], distancias = null, preds = null) {
    if (!ctx) return;
    ctx.clearRect(0, 0, lienzo.width, lienzo.height);

    aristas.forEach(arista => {
        const p1 = posicionesNodos[arista.origen];
        const p2 = posicionesNodos[arista.destino];
        const esCamino = esAristaEnAlgunCamino(arista.origen, arista.destino, caminos);
        const esAnalizada = aristasRes.some(([a, b]) => a === arista.origen && b === arista.destino);
        const color = esCamino ? '#ef4444' : esAnalizada ? '#f59e0b' : '#475569';

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = esCamino ? 5 : esAnalizada ? 3.5 : 2;
        ctx.stroke();
        dibujarCabezaFlecha(p1, p2, color);

        const mx = p1.x + (p2.x - p1.x) * 0.4;
        const my = p1.y + (p2.y - p1.y) * 0.4;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const ancho = ctx.measureText(arista.peso).width + 8;
        ctx.fillStyle = '#0b0f19';
        ctx.fillRect(mx - ancho / 2, my - 9, ancho, 18);
        ctx.fillStyle = esCamino ? '#fca5a5' : esAnalizada ? '#fcd34d' : '#cbd5e1';
        ctx.fillText(arista.peso, mx, my);
    });

    nombresNodos.forEach((nombre, idx) => {
        const p = posicionesNodos[idx];
        let colorRelleno = '#3b82f6';
        if (nodosVisitados.includes(idx)) colorRelleno = '#10b981';
        if (idx === nodoActivo) colorRelleno = '#f59e0b';
        if (esNodoEnAlgunCamino(idx, caminos)) colorRelleno = '#ef4444';

        ctx.beginPath();
        ctx.arc(p.x, p.y, 18, 0, 2 * Math.PI);
        ctx.fillStyle = colorRelleno;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(nombre, p.x, p.y);

        // Etiqueta del vértice: [distancia | predecesor]
        if (distancias) {
            const d = distancias[idx] === Infinity ? '∞' : distancias[idx];
            const pr = preds && preds[idx].length ? preds[idx].map(x => nombresNodos[x]).join(',') : '-';
            const texto = `[${d} | ${pr}]`;
            ctx.font = 'bold 11px sans-serif';
            const ancho = ctx.measureText(texto).width + 8;
            ctx.fillStyle = 'rgba(11,15,25,0.9)';
            ctx.fillRect(p.x - ancho / 2, p.y + 21, ancho, 16);
            ctx.fillStyle = '#fde68a';
            ctx.fillText(texto, p.x, p.y + 29);
        }
    });
}

function dibujarCabezaFlecha(desde, hasta, color) {
    const longitudCabeza = 10;
    const angulo = Math.atan2(hasta.y - desde.y, hasta.x - desde.x);
    const objetivoX = hasta.x - 22 * Math.cos(angulo);
    const objetivoY = hasta.y - 22 * Math.sin(angulo);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(objetivoX, objetivoY);
    ctx.lineTo(objetivoX - longitudCabeza * Math.cos(angulo - Math.PI / 6), objetivoY - longitudCabeza * Math.sin(angulo - Math.PI / 6));
    ctx.lineTo(objetivoX - longitudCabeza * Math.cos(angulo + Math.PI / 6), objetivoY - longitudCabeza * Math.sin(angulo + Math.PI / 6));
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    ctx.restore();
}

function esAristaEnAlgunCamino(u, v, caminos) {
    return caminos.some(camino => {
        for (let i = 0; i < camino.length - 1; i++) {
            if (camino[i] === u && camino[i + 1] === v) return true;
        }
        return false;
    });
}

function esNodoEnAlgunCamino(nodo, caminos) {
    return caminos.some(camino => camino.includes(nodo));
}

/* ---------------- DIJKSTRA ---------------- */

function iniciarDijkstra() {
    indiceInicio = parseInt(document.getElementById('nodoInicio').value);
    indiceFin = parseInt(document.getElementById('nodoFin').value);

    if (indiceInicio === indiceFin) {
        alert("El vértice origen y destino deben ser diferentes.");
        return;
    }

    const N = nombresNodos;
    let distancias = Array(cantidadNodos).fill(Infinity);
    let predecesores = Array.from({length: cantidadNodos}, () => []);
    let visitados = Array(cantidadNodos).fill(false);
    distancias[indiceInicio] = 0;

    pasosDijkstra = [];
    const foto = (extra) => Object.assign({
        activo: -1,
        visitados: [...visitados],
        distancias: [...distancias],
        preds: predecesores.map(p => [...p]),
        aristasRes: []
    }, extra);

    pasosDijkstra.push(foto({
        descripcion: `<b>Inicialización:</b> d(${N[indiceInicio]}) = 0 y d(resto) = ∞. Ningún vértice es definitivo todavía. Destino buscado: <b>${N[indiceFin]}</b>.`
    }));

    for (let iter = 0; iter < cantidadNodos; iter++) {
        let u = -1;
        let distMinima = Infinity;
        for (let i = 0; i < cantidadNodos; i++) {
            if (!visitados[i] && distancias[i] < distMinima) {
                distMinima = distancias[i];
                u = i;
            }
        }

        if (u === -1) {
            pasosDijkstra.push(foto({
                descripcion: `<b>Iteración ${iter + 1}:</b> los vértices no visitados restantes tienen distancia ∞ (inalcanzables desde ${N[indiceInicio]}). El algoritmo termina.`
            }));
            break;
        }

        const candidatos = [];
        for (let i = 0; i < cantidadNodos; i++) {
            if (!visitados[i] && distancias[i] < Infinity) candidatos.push(`${N[i]}=${distancias[i]}`);
        }
        visitados[u] = true;

        pasosDijkstra.push(foto({
            activo: u,
            descripcion: `<b>Iteración ${iter + 1} – Selección:</b> candidatos no visitados con etiqueta finita: ${candidatos.join(', ')}.<br>` +
                         `Se elige <b>${N[u]}</b> (menor distancia, d = ${distMinima}) y pasa a ser <b>definitivo (visitado)</b>.`
        }));

        const salientes = aristas.filter(a => a.origen === u);
        const detalles = [];
        salientes.forEach(arista => {
            const v = arista.destino;
            const txt = `${N[u]}→${N[v]} (peso ${arista.peso})`;
            if (visitados[v]) {
                detalles.push(`${txt}: ${N[v]} ya es definitivo, se ignora.`);
                return;
            }
            const alt = distancias[u] + arista.peso;
            const actual = distancias[v] === Infinity ? '∞' : distancias[v];
            if (alt < distancias[v]) {
                distancias[v] = alt;
                predecesores[v] = [u];
                detalles.push(`${txt}: ${distMinima}+${arista.peso} = ${alt} &lt; ${actual} → <b>se actualiza</b> d(${N[v]}) = ${alt}, predecesor ${N[u]}.`);
            } else if (alt === distancias[v]) {
                predecesores[v].push(u);
                detalles.push(`${txt}: ${distMinima}+${arista.peso} = ${alt} = ${actual} → <b>camino alternativo de igual costo</b>; se agrega ${N[u]} como predecesor de ${N[v]}.`);
            } else {
                detalles.push(`${txt}: ${distMinima}+${arista.peso} = ${alt} &gt; ${actual} → no mejora, se descarta.`);
            }
        });

        pasosDijkstra.push(foto({
            activo: u,
            aristasRes: salientes.map(a => [a.origen, a.destino]),
            descripcion: `<b>Iteración ${iter + 1} – Desde ${N[u]}:</b><br>` +
                (detalles.length ? detalles.join('<br>') : `${N[u]} no tiene aristas salientes; no hay nada que actualizar.`)
        }));
    }

    // Reconstrucción de todos los caminos mínimos
    let todosLosCaminos = [];
    function construirCaminos(nodoActual, caminoActual) {
        if (nodoActual === indiceInicio) {
            todosLosCaminos.push([indiceInicio, ...caminoActual]);
            return;
        }
        predecesores[nodoActual].forEach(padre => construirCaminos(padre, [nodoActual, ...caminoActual]));
    }

    const distanciaFinal = distancias[indiceFin];
    if (distanciaFinal !== Infinity) construirCaminos(indiceFin, []);

    pasosDijkstra.push(foto({
        descripcion: distanciaFinal === Infinity
            ? `<b>Resultado:</b> no existe ningún camino entre ${N[indiceInicio]} y ${N[indiceFin]}.`
            : `<b>¡Ejecución finalizada!</b> Distancia mínima ${N[indiceInicio]} → ${N[indiceFin]} = <b>${distanciaFinal}</b>. Caminos mínimos: <b>${todosLosCaminos.length}</b> (resaltados en rojo).`,
        todosLosCaminos: todosLosCaminos,
        distanciaFinal: distanciaFinal
    }));

    indicePasoActual = 0;
    document.getElementById('panelControl').style.display = 'flex';
    renderizarPaso();
}

function pasoSiguiente() {
    if (indicePasoActual < pasosDijkstra.length - 1) {
        indicePasoActual++;
        renderizarPaso();
    }
}

function pasoAnterior() {
    if (indicePasoActual > 0) {
        indicePasoActual--;
        renderizarPaso();
    }
}

function renderizarPaso() {
    const paso = pasosDijkstra[indicePasoActual];
    if (!paso) return;
    document.getElementById('descripcionPaso').innerHTML =
        `<b>Paso ${indicePasoActual + 1} de ${pasosDijkstra.length}:</b><br>` + paso.descripcion;

    let t = `<table class="matriz"><tr><th>Nodo</th>`;
    nombresNodos.forEach(n => t += `<th>${n}</th>`);
    t += `</tr><tr><td>Dist.</td>`;
    paso.distancias.forEach(d => t += `<td>${d === Infinity ? '∞' : d}</td>`);
    t += `</tr><tr><td>Pred.</td>`;
    paso.preds.forEach(p => t += `<td>${p.length ? p.map(x => nombresNodos[x]).join(',') : '-'}</td>`);
    t += `</tr><tr><td>Estado</td>`;
    paso.visitados.forEach((v, i) => t += `<td>${v ? '✔' : (i === paso.activo ? '…' : '')}</td>`);
    t += `</tr></table>`;
    document.getElementById('contenedorTabla').innerHTML = t;

    const caja = document.getElementById('resultadosResumen');
    if (paso.todosLosCaminos) {
        caja.style.display = 'block';
        if (paso.distanciaFinal === Infinity) {
            caja.innerHTML = `<b>Distancia Mínima:</b> ∞ | <b>Caminos mínimos:</b> 0`;
        } else {
            const textoCaminos = paso.todosLosCaminos.map(p => p.map(i => nombresNodos[i]).join(' → ')).join(' | ');
            caja.innerHTML = `<b>Distancia Mínima:</b> ${paso.distanciaFinal}<br>` +
                `<b>Cantidad de Caminos Mínimos:</b> ${paso.todosLosCaminos.length}<br>` +
                `<b>Secuencia(s):</b> ${textoCaminos}`;
        }
    } else {
        caja.style.display = 'none';
    }

    const idxVis = paso.visitados.map((v, i) => v ? i : -1).filter(i => i !== -1);
    dibujarGrafo(paso.activo, idxVis, paso.todosLosCaminos || [], paso.aristasRes, paso.distancias, paso.preds);
}