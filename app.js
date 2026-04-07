/* ==============================================
   PROYECTO FINAL - CALCULO INTEGRAL
   Motor matematico, escenarios, graficas y animaciones

   Contenido:
   1. Escenarios predefinidos
   2. Motor de regresion polinomial
   3. Calculo de integral definida
   4. Graficas con Chart.js
   5. Renderizado con KaTeX
   6. Sistema de escenarios interactivos
   7. Laboratorio de practica
   8. Animaciones e inicializacion
   ============================================== */

// ============================================
// 1. ESCENARIOS PREDEFINIDOS
// ============================================

const ESCENARIOS = {
    ecommerce: {
        nombre: 'API E-Commerce "ShopFlow"',
        descripcion: 'Servidor API REST de una plataforma de e-commerce. Se monitorean las solicitudes HTTP (navegacion, busqueda, compras) durante 8 horas de jornada laboral.',
        origen: 'Simulacion basada en patrones reales de trafico web de plataformas e-commerce (comportamiento tipico documentado en estudios de Cloudflare y AWS).',
        tiempo: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        solicitudes: [120, 205, 340, 435, 410, 390, 310, 200, 85],
        horas: ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'],
        observaciones: [
            'Inicio de jornada, pocos usuarios',
            'Usuarios matutinos comienzan a navegar',
            'Aumento de actividad: busquedas',
            'Hora pico: maximas compras',
            'Actividad alta sostenida',
            'Ligera caida en hora de almuerzo',
            'Actividad moderada en la tarde',
            'Usuarios empiezan a desconectar',
            'Fin de jornada, minima actividad'
        ],
        unidad: 'solicitudes/hora',
        limA: 0,
        limB: 8
    },
    streaming: {
        nombre: 'Servidor de Streaming "StreamRD"',
        descripcion: 'Plataforma de streaming de video. Se monitorean las conexiones simultaneas por hora desde el mediodia hasta la medianoche (12 horas).',
        origen: 'Simulacion basada en patrones de consumo de plataformas como Netflix y Disney+, donde el pico ocurre en horario nocturno.',
        tiempo: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        solicitudes: [80, 95, 110, 140, 190, 280, 370, 440, 500, 520, 460, 310, 140],
        horas: ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM', '12:00 AM'],
        observaciones: [
            'Mediodia, baja actividad',
            'Inicio de tarde',
            'Actividad ligera',
            'Estudiantes conectando',
            'Aumento gradual',
            'Salida del trabajo, mas usuarios',
            'Hora prime comienza',
            'Alta demanda de contenido',
            'Pico de audiencia nocturna',
            'Maximo del dia',
            'Descenso gradual',
            'Usuarios apagando',
            'Medianoche, actividad minima'
        ],
        unidad: 'conexiones/hora',
        limA: 0,
        limB: 12
    },
    delivery: {
        nombre: 'App de Delivery "QuickFood"',
        descripcion: 'Aplicacion de delivery de comida. Se registran los pedidos por hora durante 10 horas de operacion (10 AM - 8 PM).',
        origen: 'Simulacion basada en patrones de apps de delivery como Uber Eats y PedidosYa, con picos en horarios de almuerzo y cena.',
        tiempo: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        solicitudes: [45, 85, 160, 230, 195, 110, 145, 220, 310, 240, 80],
        horas: ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'],
        observaciones: [
            'Apertura, pocos pedidos',
            'Usuarios revisan menu',
            'Inicio pico almuerzo',
            'Maximo almuerzo',
            'Descenso post-almuerzo',
            'Valle de la tarde',
            'Preparacion para cena',
            'Pedidos de cena comienzan',
            'Pico de cena',
            'Pedidos tardios',
            'Cierre de operacion'
        ],
        unidad: 'pedidos/hora',
        limA: 0,
        limB: 10
    }
};

// ============================================
// 2. ESTADO GLOBAL
// ============================================

let estado = {
    escenarioActual: 'ecommerce',
    coeficientes: [],
    grado: 3,
    r2: 0,
    integralValor: 0,
    datosActuales: null, // Referencia al escenario activo
    charts: {}
};

// ============================================
// 3. MOTOR MATEMATICO
// ============================================

/** Resuelve sistema de ecuaciones por eliminacion gaussiana con pivoteo */
function resolverSistema(matriz) {
    const n = matriz.length;
    for (let col = 0; col < n; col++) {
        let maxFila = col;
        for (let fila = col + 1; fila < n; fila++) {
            if (Math.abs(matriz[fila][col]) > Math.abs(matriz[maxFila][col])) maxFila = fila;
        }
        [matriz[col], matriz[maxFila]] = [matriz[maxFila], matriz[col]];
        for (let fila = col + 1; fila < n; fila++) {
            const factor = matriz[fila][col] / matriz[col][col];
            for (let j = col; j <= n; j++) matriz[fila][j] -= factor * matriz[col][j];
        }
    }
    const sol = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        sol[i] = matriz[i][n];
        for (let j = i + 1; j < n; j++) sol[i] -= matriz[i][j] * sol[j];
        sol[i] /= matriz[i][i];
    }
    return sol;
}

/** Regresion polinomial: retorna coeficientes [a0, a1, a2, ...] */
function regresionPolinomial(xDatos, yDatos, grado) {
    const n = xDatos.length;
    const m = grado + 1;
    const mat = [];
    for (let i = 0; i < m; i++) {
        mat[i] = new Array(m + 1).fill(0);
        for (let j = 0; j < m; j++) {
            for (let k = 0; k < n; k++) mat[i][j] += Math.pow(xDatos[k], i + j);
        }
        for (let k = 0; k < n; k++) mat[i][m] += yDatos[k] * Math.pow(xDatos[k], i);
    }
    return resolverSistema(mat);
}

/** Evalua polinomio en un punto */
function evalPoli(coefs, x) {
    let r = 0;
    for (let i = 0; i < coefs.length; i++) r += coefs[i] * Math.pow(x, i);
    return r;
}

/** Calcula R-cuadrado */
function calcularR2(xD, yD, coefs) {
    const n = yD.length;
    const yProm = yD.reduce((a, b) => a + b, 0) / n;
    let ssRes = 0, ssTot = 0;
    for (let i = 0; i < n; i++) {
        ssRes += Math.pow(yD[i] - evalPoli(coefs, xD[i]), 2);
        ssTot += Math.pow(yD[i] - yProm, 2);
    }
    return 1 - ssRes / ssTot;
}

/** Integral definida del polinomio usando antiderivada */
function integralDefinida(coefs, a, b) {
    function F(t) {
        let v = 0;
        for (let i = 0; i < coefs.length; i++) v += (coefs[i] / (i + 1)) * Math.pow(t, i + 1);
        return v;
    }
    return F(b) - F(a);
}

// ============================================
// 4. FORMATO LATEX
// ============================================

/** Formatea coeficientes como LaTeX */
function poliLatex(coefs) {
    const terms = [];
    for (let i = coefs.length - 1; i >= 0; i--) {
        const c = coefs[i];
        if (Math.abs(c) < 0.001) continue;
        const v = Math.abs(c);
        const s = c >= 0 ? '+' : '-';
        const vs = v.toFixed(2).replace(/\.?0+$/, '');
        let t = '';
        if (i === 0) t = vs;
        else if (i === 1) t = (v === 1 ? '' : vs) + 't';
        else t = (v === 1 ? '' : vs) + 't^{' + i + '}';
        terms.push(terms.length === 0 ? (c < 0 ? '-' + t : t) : s + ' ' + t);
    }
    return terms.join(' ') || '0';
}

/** Formatea antiderivada como LaTeX */
function antiderivadaLatex(coefs) {
    const terms = [];
    for (let i = coefs.length - 1; i >= 0; i--) {
        const c = coefs[i];
        if (Math.abs(c) < 0.001) continue;
        const frac = Math.abs(c) / (i + 1);
        const s = c >= 0 ? '+' : '-';
        const fs = frac.toFixed(4).replace(/\.?0+$/, '');
        const p = i + 1;
        const t = p === 1 ? fs + 't' : fs + 't^{' + p + '}';
        terms.push(terms.length === 0 ? (c < 0 ? '-' + t : t) : s + ' ' + t);
    }
    return terms.join(' ') || '0';
}

// ============================================
// 5. GRAFICAS
// ============================================

const COL = {
    azul: '#2563eb',
    azulRgba: 'rgba(37,99,235,0.8)',
    purpura: '#7c3aed',
    areaFill: 'rgba(37,99,235,0.12)',
    areaFuerte: 'rgba(37,99,235,0.22)',
    grid: 'rgba(0,0,0,0.06)',
    texto: '#64748b'
};

function opcionesBase(tX, tY) {
    return {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: { labels: { color: COL.texto, font: { family: 'Inter', size: 12 } } }
        },
        scales: {
            x: {
                title: { display: true, text: tX, color: COL.texto, font: { family: 'Inter' } },
                grid: { color: COL.grid },
                ticks: { color: COL.texto }
            },
            y: {
                title: { display: true, text: tY, color: COL.texto, font: { family: 'Inter' } },
                grid: { color: COL.grid },
                ticks: { color: COL.texto },
                beginAtZero: true
            }
        }
    };
}

function crearGraficaDispersion() {
    const ctx = document.getElementById('chartDispersion');
    if (!ctx) return;
    const d = estado.datosActuales;
    if (estado.charts.dispersion) estado.charts.dispersion.destroy();
    estado.charts.dispersion = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Datos observados',
                data: d.tiempo.map((t, i) => ({ x: t, y: d.solicitudes[i] })),
                backgroundColor: COL.azulRgba,
                borderColor: COL.azul,
                pointRadius: 7,
                pointHoverRadius: 10,
                pointBorderWidth: 2
            }]
        },
        options: opcionesBase('Tiempo (horas)', d.unidad || 'solicitudes/hora')
    });
}

function crearGraficaRegresion() {
    const ctx = document.getElementById('chartRegresion');
    if (!ctx) return;
    const d = estado.datosActuales;
    const tMax = Math.max(...d.tiempo);
    const cx = [], cy = [];
    for (let t = 0; t <= tMax; t += 0.05) { cx.push(t); cy.push(evalPoli(estado.coeficientes, t)); }
    if (estado.charts.regresion) estado.charts.regresion.destroy();
    estado.charts.regresion = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Curva r(t)',
                    data: cx.map((x, i) => ({ x, y: cy[i] })),
                    type: 'line', borderColor: COL.purpura, borderWidth: 3,
                    pointRadius: 0, tension: 0.4, order: 2
                },
                {
                    label: 'Datos observados',
                    data: d.tiempo.map((t, i) => ({ x: t, y: d.solicitudes[i] })),
                    backgroundColor: COL.azulRgba, borderColor: COL.azul,
                    pointRadius: 7, pointBorderWidth: 2, order: 1
                }
            ]
        },
        options: opcionesBase('Tiempo (horas)', d.unidad || 'solicitudes/hora')
    });
}

function crearGraficaIntegral(a, b) {
    const ctx = document.getElementById('chartIntegral');
    if (!ctx) return;
    const d = estado.datosActuales;
    const tMax = Math.max(...d.tiempo);
    const cx = [], cy = [], ax = [], ay = [];
    for (let t = 0; t <= tMax; t += 0.05) { cx.push(t); cy.push(evalPoli(estado.coeficientes, t)); }
    for (let t = a; t <= b; t += 0.05) { ax.push(t); ay.push(evalPoli(estado.coeficientes, t)); }
    if (estado.charts.integral) estado.charts.integral.destroy();
    estado.charts.integral = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Area = Integral',
                    data: ax.map((x, i) => ({ x, y: ay[i] })),
                    type: 'line', fill: 'origin', backgroundColor: COL.areaFuerte,
                    borderColor: 'transparent', pointRadius: 0, tension: 0.4, order: 3
                },
                {
                    label: 'r(t)',
                    data: cx.map((x, i) => ({ x, y: cy[i] })),
                    type: 'line', borderColor: COL.purpura, borderWidth: 3,
                    pointRadius: 0, fill: false, tension: 0.4, order: 2
                },
                {
                    label: 'Datos',
                    data: d.tiempo.map((t, i) => ({ x: t, y: d.solicitudes[i] })),
                    backgroundColor: COL.azulRgba, borderColor: COL.azul,
                    pointRadius: 6, pointBorderWidth: 2, order: 1
                }
            ]
        },
        options: opcionesBase('Tiempo (horas)', d.unidad || 'solicitudes/hora')
    });
}

// Grafica del laboratorio (todo en uno)
function crearGraficaLab(tData, rData, coefs, a, b) {
    const ctx = document.getElementById('chartLab');
    if (!ctx) return;
    const tMax = Math.max(...tData);
    const cx = [], cy = [], ax = [], ay = [];
    for (let t = 0; t <= tMax; t += 0.05) { cx.push(t); cy.push(evalPoli(coefs, t)); }
    for (let t = a; t <= b; t += 0.05) { ax.push(t); ay.push(evalPoli(coefs, t)); }
    if (estado.charts.lab) estado.charts.lab.destroy();
    estado.charts.lab = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Area = Integral',
                    data: ax.map((x, i) => ({ x, y: ay[i] })),
                    type: 'line', fill: 'origin', backgroundColor: COL.areaFuerte,
                    borderColor: 'transparent', pointRadius: 0, tension: 0.4, order: 3
                },
                {
                    label: 'r(t)',
                    data: cx.map((x, i) => ({ x, y: cy[i] })),
                    type: 'line', borderColor: COL.purpura, borderWidth: 3,
                    pointRadius: 0, fill: false, tension: 0.4, order: 2
                },
                {
                    label: 'Datos',
                    data: tData.map((t, i) => ({ x: t, y: rData[i] })),
                    backgroundColor: COL.azulRgba, borderColor: COL.azul,
                    pointRadius: 7, pointBorderWidth: 2, order: 1
                }
            ]
        },
        options: opcionesBase('Tiempo', 'r(t)')
    });
}

// ============================================
// 6. RENDERIZADO DE SECCIONES
// ============================================

function renderTabla() {
    const tbody = document.getElementById('datosBody');
    if (!tbody) return;
    const d = estado.datosActuales;
    tbody.innerHTML = d.tiempo.map((t, i) =>
        `<tr>
            <td><strong>${t}</strong></td>
            <td>${d.horas[i] || t}</td>
            <td><strong>${d.solicitudes[i]}</strong></td>
            <td>${d.observaciones[i] || ''}</td>
        </tr>`
    ).join('');
}

function renderKatex(id, latex, display = true) {
    const el = document.getElementById(id);
    if (!el || typeof katex === 'undefined') return;
    try { katex.render(latex, el, { displayMode: display, throwOnError: false }); }
    catch(e) { el.textContent = latex; }
}

function renderFormulas() {
    if (typeof katex === 'undefined') return;
    const pl = poliLatex(estado.coeficientes);

    renderKatex('heroFormula', '\\int_{0}^{8} r(t)\\, dt = \\text{Total acumulado}');
    renderKatex('mathIntro', '\\int_{a}^{b} r(t)\\, dt');
    renderKatex('formulaDisplay', 'r(t) = ' + pl);
    renderKatex('integralSetup',
        '\\int_{a}^{b} r(t)\\, dt = \\int_{a}^{b} \\left(' + pl + '\\right) dt'
    );
}

function mostrarProcedimiento(a, b) {
    const div = document.getElementById('procedimiento');
    if (!div) return;
    const pl = poliLatex(estado.coeficientes);
    const al = antiderivadaLatex(estado.coeficientes);

    function F(t) {
        let v = 0;
        for (let i = 0; i < estado.coeficientes.length; i++)
            v += (estado.coeficientes[i] / (i + 1)) * Math.pow(t, i + 1);
        return v;
    }
    const Fb = F(b), Fa = F(a);
    estado.integralValor = Fb - Fa;

    const pasos = [
        { t: 'Paso 1', l: `\\int_{${a}}^{${b}} \\left(${pl}\\right) dt` },
        { t: 'Paso 2: Antiderivada', l: `F(t) = ${al}` },
        { t: 'Paso 3: Evaluar', l: `F(${b}) - F(${a}) = ${Fb.toFixed(2)} - (${Fa.toFixed(2)})` },
        { t: 'Resultado', l: `\\boxed{\\int_{${a}}^{${b}} r(t)\\, dt \\approx ${estado.integralValor.toFixed(2)}}` }
    ];

    div.innerHTML = pasos.map(p =>
        `<div class="paso">
            <span class="paso-num">${p.t}</span>
            <div class="paso-contenido" id="p-${p.t.replace(/\s+/g, '')}"></div>
        </div>`
    ).join('');

    pasos.forEach(p => renderKatex('p-' + p.t.replace(/\s+/g, ''), p.l));
}

function mostrarResultado(a, b) {
    const res = estado.integralValor;
    const horas = b - a;
    const prom = res / horas;
    const d = estado.datosActuales;
    let pico = 0;
    const tMax = Math.max(...d.tiempo);
    for (let t = a; t <= b; t += 0.01) {
        const v = evalPoli(estado.coeficientes, t);
        if (v > pico) pico = v;
    }

    const box = document.getElementById('resultadoBox');
    if (box) box.style.display = 'block';

    const unidad = d.unidad || 'solicitudes';
    const uEl = document.getElementById('resultadoUnidad');
    if (uEl) uEl.textContent = unidad.split('/')[0];

    animarContador('resultadoValor', res);
    animarContador('statTotal', res);
    animarContador('statPromedio', prom);
    animarContador('statPico', pico);

    const r2El = document.getElementById('statR2');
    if (r2El) r2El.textContent = (estado.r2 * 100).toFixed(1) + '%';

    const interp = document.getElementById('interpretacionTexto');
    if (interp) {
        interp.innerHTML = `
            <p>El resultado de la integral definida indica que el sistema <strong>${d.nombre}</strong>
            proceso aproximadamente <strong>${Math.round(res).toLocaleString()} ${unidad.split('/')[0]}</strong>
            durante las <strong>${horas} horas</strong> del intervalo [${a}, ${b}].</p>
            <p>Esto equivale a un promedio de <strong>${Math.round(prom)} ${unidad}</strong>.
            La tasa maxima del modelo fue <strong>${Math.round(pico)} ${unidad}</strong>.</p>
            <p>En un contexto real, esta informacion permite <strong>dimensionar recursos del servidor</strong>,
            garantizar calidad de servicio y <strong>estimar costos</strong> de infraestructura cloud.</p>
        `;
    }
}

function animarContador(id, valorFinal) {
    const el = document.getElementById(id);
    if (!el) return;
    const dur = 1200, ini = performance.now();
    function upd(now) {
        const p = Math.min((now - ini) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(valorFinal * e).toLocaleString();
        if (p < 1) requestAnimationFrame(upd);
        else el.textContent = Math.round(valorFinal).toLocaleString();
    }
    requestAnimationFrame(upd);
}

// ============================================
// 7. SISTEMA DE ESCENARIOS
// ============================================

function cargarEscenario(id) {
    estado.escenarioActual = id;

    if (id === 'custom') {
        // Mostrar editor personalizado
        const ed = document.getElementById('customEditor');
        if (ed) ed.style.display = 'block';
        const desc = document.getElementById('scenarioDesc');
        if (desc) desc.textContent = 'Ingresa tus propios datos para analizar cualquier escenario.';
        return;
    }

    // Ocultar editor personalizado
    const ed = document.getElementById('customEditor');
    if (ed) ed.style.display = 'none';

    const esc = ESCENARIOS[id];
    if (!esc) return;

    estado.datosActuales = esc;

    // Actualizar descripcion
    const desc = document.getElementById('scenarioDesc');
    if (desc) desc.innerHTML = `<strong>${esc.nombre}:</strong> ${esc.descripcion}`;

    // Actualizar origen
    const orig = document.getElementById('datosOrigen');
    if (orig) orig.innerHTML = `<strong>Origen de los datos:</strong> ${esc.origen}`;

    // Actualizar limites
    const lA = document.getElementById('limiteA');
    const lB = document.getElementById('limiteB');
    if (lA) lA.value = esc.limA;
    if (lB) lB.value = esc.limB;

    recalcularTodo();
}

function aplicarDatosCustom() {
    const tInput = document.getElementById('customT');
    const rInput = document.getElementById('customR');
    if (!tInput || !rInput) return;

    const tArr = tInput.value.split(',').map(Number).filter(n => !isNaN(n));
    const rArr = rInput.value.split(',').map(Number).filter(n => !isNaN(n));

    if (tArr.length < 3 || rArr.length < 3 || tArr.length !== rArr.length) {
        alert('Debes ingresar al menos 3 pares de datos validos y ambas listas deben tener la misma longitud.');
        return;
    }

    estado.datosActuales = {
        nombre: 'Escenario Personalizado',
        descripcion: 'Datos ingresados manualmente por el usuario.',
        origen: 'Datos personalizados ingresados durante la practica.',
        tiempo: tArr,
        solicitudes: rArr,
        horas: tArr.map(t => 't=' + t),
        observaciones: tArr.map(() => ''),
        unidad: 'unidades/hora',
        limA: Math.min(...tArr),
        limB: Math.max(...tArr)
    };

    const lA = document.getElementById('limiteA');
    const lB = document.getElementById('limiteB');
    if (lA) lA.value = estado.datosActuales.limA;
    if (lB) lB.value = estado.datosActuales.limB;

    recalcularTodo();
}

function recalcularTodo() {
    const d = estado.datosActuales;
    if (!d) return;

    // Regresion
    estado.coeficientes = regresionPolinomial(d.tiempo, d.solicitudes, estado.grado);
    estado.r2 = calcularR2(d.tiempo, d.solicitudes, estado.coeficientes);

    // Actualizar R2
    const r2El = document.getElementById('r2Value');
    if (r2El) r2El.textContent = estado.r2.toFixed(6);

    // Renderizar
    renderTabla();
    crearGraficaDispersion();
    crearGraficaRegresion();
    renderFormulas();

    // Calcular integral
    const a = parseFloat(document.getElementById('limiteA')?.value) || d.limA;
    const b = parseFloat(document.getElementById('limiteB')?.value) || d.limB;
    mostrarProcedimiento(a, b);
    crearGraficaIntegral(a, b);
    mostrarResultado(a, b);
}

// ============================================
// 8. LABORATORIO INTERACTIVO
// ============================================

function calcularLaboratorio() {
    const tInput = document.getElementById('labT');
    const rInput = document.getElementById('labR');
    const gInput = document.getElementById('labGrado');
    const aInput = document.getElementById('labA');
    const bInput = document.getElementById('labB');
    if (!tInput || !rInput) return;

    const tArr = tInput.value.split(',').map(Number).filter(n => !isNaN(n));
    const rArr = rInput.value.split(',').map(Number).filter(n => !isNaN(n));
    const grado = parseInt(gInput?.value) || 3;
    const a = parseFloat(aInput?.value) || 0;
    const b = parseFloat(bInput?.value) || Math.max(...tArr);

    if (tArr.length < 3 || rArr.length < 3 || tArr.length !== rArr.length) {
        alert('Ingresa al menos 3 pares de datos validos.');
        return;
    }

    if (a >= b) {
        alert('El limite inferior debe ser menor que el superior.');
        return;
    }

    const coefs = regresionPolinomial(tArr, rArr, grado);
    const r2 = calcularR2(tArr, rArr, coefs);
    const resultado = integralDefinida(coefs, a, b);

    // Mostrar formula
    renderKatex('labFormula', 'r(t) = ' + poliLatex(coefs));

    // Mostrar R2
    const r2El = document.getElementById('labR2');
    if (r2El) r2El.textContent = r2.toFixed(6);

    // Mostrar resultado
    renderKatex('labResultado',
        `\\int_{${a}}^{${b}} r(t)\\,dt \\approx ${resultado.toFixed(2)} \\text{ unidades}`
    );

    // Grafica
    crearGraficaLab(tArr, rArr, coefs, a, b);
}

// ============================================
// 9. EVENTOS E INICIALIZACION
// ============================================

function configurarEventos() {
    // Selector de escenarios
    document.querySelectorAll('.scenario-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            cargarEscenario(btn.dataset.id);
        });
    });

    // Boton datos personalizados
    const btnCustom = document.getElementById('btnCustomApply');
    if (btnCustom) btnCustom.addEventListener('click', aplicarDatosCustom);

    // Selector de grado
    document.querySelectorAll('.degree-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.degree-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            estado.grado = parseInt(btn.dataset.degree);
            recalcularTodo();
        });
    });

    // Boton calcular integral
    const btnCalc = document.getElementById('btnCalcular');
    if (btnCalc) {
        btnCalc.addEventListener('click', () => {
            const a = parseFloat(document.getElementById('limiteA').value) || 0;
            const b = parseFloat(document.getElementById('limiteB').value) || 8;
            if (a >= b) { alert('Limite inferior debe ser menor que el superior.'); return; }
            mostrarProcedimiento(a, b);
            crearGraficaIntegral(a, b);
            mostrarResultado(a, b);
        });
    }

    // Laboratorio
    const btnLab = document.getElementById('btnLab');
    if (btnLab) btnLab.addEventListener('click', calcularLaboratorio);
}

function iniciarAnimaciones() {
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));

    // Navegacion activa
    const secciones = document.querySelectorAll('section');
    const enlaces = document.querySelectorAll('.nav-links a');
    const navObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                const id = e.target.id;
                enlaces.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
            }
        });
    }, { threshold: 0.3 });
    secciones.forEach(s => navObs.observe(s));
}

// Inicio de la aplicacion
document.addEventListener('DOMContentLoaded', () => {
    // Cargar escenario por defecto
    estado.datosActuales = ESCENARIOS.ecommerce;

    // Esperar a que KaTeX cargue
    const esperar = setInterval(() => {
        if (typeof katex !== 'undefined') {
            clearInterval(esperar);
            recalcularTodo();
        }
    }, 100);

    // Fallback: si KaTeX tarda, iniciar sin formulas
    setTimeout(() => {
        if (typeof katex === 'undefined') recalcularTodo();
    }, 2000);

    configurarEventos();
    iniciarAnimaciones();
});
