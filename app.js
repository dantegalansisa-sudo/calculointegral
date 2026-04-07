/* ==============================================
   PROYECTO INTEGRAL DEFINIDA
   Motor matemático, gráficas y animaciones

   Este archivo contiene:
   1. Datos simulados del servidor
   2. Motor de regresión polinomial (mínimos cuadrados)
   3. Cálculo de integral definida
   4. Visualización con Chart.js
   5. Renderizado de fórmulas con KaTeX
   6. Animaciones de scroll
   ============================================== */

// ============================================
// 1. DATOS SIMULADOS DEL SERVIDOR
// ============================================

// Datos de monitoreo: solicitudes/hora en un servidor API de e-commerce
// durante una jornada laboral de 8 horas (8:00 AM - 4:00 PM)
const DATOS = {
    tiempo: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    solicitudes: [120, 205, 340, 435, 410, 390, 310, 200, 85],
    horas: [
        '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
        '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'
    ],
    observaciones: [
        'Inicio de jornada, pocos usuarios conectados',
        'Usuarios matutinos comienzan a navegar',
        'Incremento de actividad: búsquedas y navegación',
        'Hora pico de la mañana: máximas compras',
        'Actividad alta sostenida al mediodía',
        'Ligera caída durante hora de almuerzo',
        'Actividad moderada en la tarde',
        'Usuarios comienzan a desconectarse',
        'Fin de jornada, mínima actividad'
    ]
};

// Estado global de la aplicación
let estado = {
    coeficientes: [],   // Coeficientes del polinomio actual
    grado: 3,           // Grado del polinomio seleccionado
    r2: 0,              // Coeficiente de determinación
    integralValor: 0,   // Resultado de la integral
    charts: {}          // Referencias a las gráficas
};

// ============================================
// 2. MOTOR MATEMÁTICO - REGRESIÓN POLINOMIAL
// ============================================

/**
 * Resuelve un sistema de ecuaciones lineales por eliminación gaussiana.
 * Recibe la matriz aumentada [A|b] y retorna el vector solución.
 */
function resolverSistema(matriz) {
    const n = matriz.length;

    // Eliminación hacia adelante con pivoteo parcial
    for (let col = 0; col < n; col++) {
        // Buscar el pivote más grande en la columna
        let maxFila = col;
        for (let fila = col + 1; fila < n; fila++) {
            if (Math.abs(matriz[fila][col]) > Math.abs(matriz[maxFila][col])) {
                maxFila = fila;
            }
        }
        // Intercambiar filas
        [matriz[col], matriz[maxFila]] = [matriz[maxFila], matriz[col]];

        // Eliminar por debajo del pivote
        for (let fila = col + 1; fila < n; fila++) {
            const factor = matriz[fila][col] / matriz[col][col];
            for (let j = col; j <= n; j++) {
                matriz[fila][j] -= factor * matriz[col][j];
            }
        }
    }

    // Sustitución hacia atrás
    const solucion = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        solucion[i] = matriz[i][n];
        for (let j = i + 1; j < n; j++) {
            solucion[i] -= matriz[i][j] * solucion[j];
        }
        solucion[i] /= matriz[i][i];
    }

    return solucion;
}

/**
 * Realiza regresión polinomial de grado dado usando mínimos cuadrados.
 * Retorna los coeficientes [a0, a1, a2, ...] donde p(x) = a0 + a1*x + a2*x² + ...
 */
function regresionPolinomial(xDatos, yDatos, grado) {
    const n = xDatos.length;
    const m = grado + 1; // Número de coeficientes

    // Construir la matriz normal: (Xᵀ·X)·a = Xᵀ·y
    // Matriz aumentada de tamaño m × (m+1)
    const matriz = [];
    for (let i = 0; i < m; i++) {
        matriz[i] = new Array(m + 1).fill(0);
        for (let j = 0; j < m; j++) {
            // Elemento (i,j) = Σ xₖ^(i+j)
            for (let k = 0; k < n; k++) {
                matriz[i][j] += Math.pow(xDatos[k], i + j);
            }
        }
        // Columna del lado derecho: Σ yₖ · xₖ^i
        for (let k = 0; k < n; k++) {
            matriz[i][m] += yDatos[k] * Math.pow(xDatos[k], i);
        }
    }

    return resolverSistema(matriz);
}

/**
 * Evalúa el polinomio en un punto x.
 * coefs = [a0, a1, a2, ...] → p(x) = a0 + a1*x + a2*x² + ...
 */
function evaluarPolinomio(coefs, x) {
    let resultado = 0;
    for (let i = 0; i < coefs.length; i++) {
        resultado += coefs[i] * Math.pow(x, i);
    }
    return resultado;
}

/**
 * Calcula el coeficiente de determinación R².
 * Mide qué tan bien el polinomio se ajusta a los datos (1 = perfecto).
 */
function calcularR2(xDatos, yDatos, coefs) {
    const n = yDatos.length;
    const yPromedio = yDatos.reduce((a, b) => a + b, 0) / n;

    let ssRes = 0; // Suma de cuadrados de residuos
    let ssTot = 0; // Suma de cuadrados total

    for (let i = 0; i < n; i++) {
        const yPredicho = evaluarPolinomio(coefs, xDatos[i]);
        ssRes += Math.pow(yDatos[i] - yPredicho, 2);
        ssTot += Math.pow(yDatos[i] - yPromedio, 2);
    }

    return 1 - (ssRes / ssTot);
}

/**
 * Calcula la integral definida de un polinomio entre a y b.
 * Usa la antiderivada: ∫(a0 + a1*x + a2*x² + ...) dx = a0*x + (a1/2)*x² + (a2/3)*x³ + ...
 * Luego evalúa F(b) - F(a).
 */
function integralDefinida(coefs, a, b) {
    // Evaluar la antiderivada en un punto
    function F(t) {
        let valor = 0;
        for (let i = 0; i < coefs.length; i++) {
            valor += (coefs[i] / (i + 1)) * Math.pow(t, i + 1);
        }
        return valor;
    }
    return F(b) - F(a);
}

// ============================================
// 3. FORMATO DE FÓRMULAS PARA KATEX
// ============================================

/**
 * Convierte coeficientes a string LaTeX para mostrar la función.
 * Ejemplo: [7.2, 16.1, -3.5] → "r(t) = -3.5t^{2} + 16.1t + 7.2"
 */
function formatearPolinomioLatex(coefs) {
    const terminos = [];

    // Recorrer de mayor a menor grado para el formato estándar
    for (let i = coefs.length - 1; i >= 0; i--) {
        const c = coefs[i];
        if (Math.abs(c) < 0.001) continue; // Ignorar coeficientes muy pequeños

        const valor = Math.abs(c);
        const signo = c >= 0 ? '+' : '-';
        let termino = '';

        // Formatear el coeficiente con decimales razonables
        const valorStr = valor.toFixed(2).replace(/\.?0+$/, '');

        if (i === 0) {
            termino = valorStr;
        } else if (i === 1) {
            termino = (valor === 1 ? '' : valorStr) + 't';
        } else {
            termino = (valor === 1 ? '' : valorStr) + 't^{' + i + '}';
        }

        if (terminos.length === 0) {
            // Primer término: incluir signo solo si es negativo
            terminos.push(c < 0 ? '-' + termino : termino);
        } else {
            terminos.push(signo + ' ' + termino);
        }
    }

    return terminos.join(' ');
}

/**
 * Genera el LaTeX de la antiderivada del polinomio.
 */
function formatearAntiderivadaLatex(coefs) {
    const terminos = [];

    for (let i = coefs.length - 1; i >= 0; i--) {
        const c = coefs[i];
        if (Math.abs(c) < 0.001) continue;

        const divisor = i + 1;
        const valor = Math.abs(c);
        const signo = c >= 0 ? '+' : '-';
        let termino = '';

        // Si el coeficiente es divisible limpio, simplificar
        const fraccion = valor / divisor;
        const fracStr = fraccion.toFixed(4).replace(/\.?0+$/, '');

        const potencia = i + 1;
        if (potencia === 1) {
            termino = fracStr + 't';
        } else {
            termino = fracStr + 't^{' + potencia + '}';
        }

        if (terminos.length === 0) {
            terminos.push(c < 0 ? '-' + termino : termino);
        } else {
            terminos.push(signo + ' ' + termino);
        }
    }

    return terminos.join(' ');
}

// ============================================
// 4. GRÁFICAS CON CHART.JS
// ============================================

// Colores del tema
const COLORES = {
    acento: '#00d4ff',
    acentoRgba: 'rgba(0, 212, 255, 0.8)',
    purpura: '#7c3aed',
    areaFill: 'rgba(0, 212, 255, 0.15)',
    areaFillFuerte: 'rgba(0, 212, 255, 0.25)',
    grid: 'rgba(255, 255, 255, 0.06)',
    texto: '#9090b0',
    puntos: '#00d4ff',
    curva: '#7c3aed'
};

// Opciones comunes de las gráficas
function opcionesBase(tituloX, tituloY) {
    return {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                labels: { color: COLORES.texto, font: { family: 'Inter', size: 12 } }
            }
        },
        scales: {
            x: {
                title: { display: true, text: tituloX, color: COLORES.texto, font: { family: 'Inter' } },
                grid: { color: COLORES.grid },
                ticks: { color: COLORES.texto }
            },
            y: {
                title: { display: true, text: tituloY, color: COLORES.texto, font: { family: 'Inter' } },
                grid: { color: COLORES.grid },
                ticks: { color: COLORES.texto },
                beginAtZero: true
            }
        }
    };
}

/** Crea la gráfica de dispersión con los datos crudos */
function crearGraficaDispersion() {
    const ctx = document.getElementById('chartDispersion');
    if (!ctx) return;

    estado.charts.dispersion = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Datos observados',
                data: DATOS.tiempo.map((t, i) => ({ x: t, y: DATOS.solicitudes[i] })),
                backgroundColor: COLORES.acentoRgba,
                borderColor: COLORES.acento,
                pointRadius: 7,
                pointHoverRadius: 10,
                pointBorderWidth: 2
            }]
        },
        options: opcionesBase('Tiempo (horas)', 'Solicitudes / hora')
    });
}

/** Crea la gráfica de regresión: datos + curva ajustada */
function crearGraficaRegresion() {
    const ctx = document.getElementById('chartRegresion');
    if (!ctx) return;

    // Generar puntos de la curva (suavizada con muchos puntos)
    const curvaX = [];
    const curvaY = [];
    for (let t = 0; t <= 8; t += 0.05) {
        curvaX.push(t);
        curvaY.push(evaluarPolinomio(estado.coeficientes, t));
    }

    // Destruir gráfica anterior si existe
    if (estado.charts.regresion) estado.charts.regresion.destroy();

    estado.charts.regresion = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Curva r(t) ajustada',
                    data: curvaX.map((x, i) => ({ x, y: curvaY[i] })),
                    type: 'line',
                    borderColor: COLORES.curva,
                    borderWidth: 3,
                    pointRadius: 0,
                    tension: 0.4,
                    order: 2
                },
                {
                    label: 'Datos observados',
                    data: DATOS.tiempo.map((t, i) => ({ x: t, y: DATOS.solicitudes[i] })),
                    backgroundColor: COLORES.acentoRgba,
                    borderColor: COLORES.acento,
                    pointRadius: 7,
                    pointHoverRadius: 10,
                    pointBorderWidth: 2,
                    order: 1
                }
            ]
        },
        options: opcionesBase('Tiempo (horas)', 'Solicitudes / hora')
    });
}

/** Crea la gráfica de la integral: área bajo la curva */
function crearGraficaIntegral(a, b) {
    const ctx = document.getElementById('chartIntegral');
    if (!ctx) return;

    const curvaX = [];
    const curvaY = [];
    const areaX = [];
    const areaY = [];

    // Curva completa
    for (let t = 0; t <= 8; t += 0.05) {
        const y = evaluarPolinomio(estado.coeficientes, t);
        curvaX.push(t);
        curvaY.push(y);
    }

    // Área solo en el intervalo [a, b]
    for (let t = a; t <= b; t += 0.05) {
        const y = evaluarPolinomio(estado.coeficientes, t);
        areaX.push(t);
        areaY.push(y);
    }

    if (estado.charts.integral) estado.charts.integral.destroy();

    estado.charts.integral = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Área = Integral definida',
                    data: areaX.map((x, i) => ({ x, y: areaY[i] })),
                    type: 'line',
                    fill: 'origin',
                    backgroundColor: COLORES.areaFillFuerte,
                    borderColor: 'transparent',
                    pointRadius: 0,
                    tension: 0.4,
                    order: 3
                },
                {
                    label: 'r(t)',
                    data: curvaX.map((x, i) => ({ x, y: curvaY[i] })),
                    type: 'line',
                    borderColor: COLORES.curva,
                    borderWidth: 3,
                    pointRadius: 0,
                    fill: false,
                    tension: 0.4,
                    order: 2
                },
                {
                    label: 'Datos observados',
                    data: DATOS.tiempo.map((t, i) => ({ x: t, y: DATOS.solicitudes[i] })),
                    backgroundColor: COLORES.acentoRgba,
                    borderColor: COLORES.acento,
                    pointRadius: 6,
                    pointBorderWidth: 2,
                    order: 1
                }
            ]
        },
        options: opcionesBase('Tiempo (horas)', 'Solicitudes / hora')
    });
}

// ============================================
// 5. RENDERIZADO DE SECCIONES
// ============================================

/** Llena la tabla de datos */
function renderizarTabla() {
    const tbody = document.getElementById('datosBody');
    if (!tbody) return;

    tbody.innerHTML = DATOS.tiempo.map((t, i) =>
        `<tr>
            <td><strong>${t}</strong></td>
            <td>${DATOS.horas[i]}</td>
            <td><strong>${DATOS.solicitudes[i]}</strong></td>
            <td>${DATOS.observaciones[i]}</td>
        </tr>`
    ).join('');
}

/** Renderiza una expresión KaTeX en un elemento */
function renderKatex(elementId, latex, displayMode = true) {
    const el = document.getElementById(elementId);
    if (!el) return;
    try {
        katex.render(latex, el, { displayMode, throwOnError: false });
    } catch (e) {
        el.textContent = latex;
    }
}

/** Renderiza las fórmulas matemáticas principales */
function renderizarFormulas() {
    // Fórmula del hero
    renderKatex('heroFormula',
        '\\int_{0}^{8} r(t)\\, dt = \\text{Total de solicitudes}'
    );

    // Fórmula de introducción
    renderKatex('mathIntro',
        '\\int_{a}^{b} r(t)\\, dt'
    );

    // Función encontrada
    const poliLatex = formatearPolinomioLatex(estado.coeficientes);
    renderKatex('formulaDisplay', 'r(t) = ' + poliLatex);

    // Planteamiento de la integral
    renderKatex('integralSetup',
        '\\int_{a}^{b} r(t)\\, dt = \\int_{a}^{b} \\left(' + poliLatex + '\\right) dt'
    );
}

/** Muestra el procedimiento paso a paso del cálculo de la integral */
function mostrarProcedimiento(a, b) {
    const div = document.getElementById('procedimiento');
    if (!div) return;

    const poliLatex = formatearPolinomioLatex(estado.coeficientes);
    const antiLatex = formatearAntiderivadaLatex(estado.coeficientes);

    // Evaluar F(b) y F(a)
    function F(t) {
        let val = 0;
        for (let i = 0; i < estado.coeficientes.length; i++) {
            val += (estado.coeficientes[i] / (i + 1)) * Math.pow(t, i + 1);
        }
        return val;
    }
    const Fb = F(b);
    const Fa = F(a);
    const resultado = Fb - Fa;

    // Guardar resultado en el estado
    estado.integralValor = resultado;

    const pasos = [
        {
            titulo: 'Paso 1',
            latex: `\\int_{${a}}^{${b}} \\left(${poliLatex}\\right) dt`
        },
        {
            titulo: 'Paso 2: Antiderivada',
            latex: `F(t) = ${antiLatex}`
        },
        {
            titulo: 'Paso 3: Evaluar',
            latex: `F(${b}) - F(${a}) = ${Fb.toFixed(2)} - (${Fa.toFixed(2)})`
        },
        {
            titulo: 'Resultado',
            latex: `\\boxed{\\int_{${a}}^{${b}} r(t)\\, dt = ${resultado.toFixed(2)} \\text{ solicitudes}}`
        }
    ];

    div.innerHTML = pasos.map(p =>
        `<div class="paso">
            <span class="paso-num">${p.titulo}</span>
            <div class="paso-contenido" id="paso-${p.titulo.replace(/\s+/g, '')}"></div>
        </div>`
    ).join('');

    // Renderizar KaTeX en cada paso
    pasos.forEach(p => {
        const id = 'paso-' + p.titulo.replace(/\s+/g, '');
        renderKatex(id, p.latex);
    });
}

/** Muestra el resultado grande y actualiza estadísticas */
function mostrarResultado(a, b) {
    const resultado = estado.integralValor;
    const horas = b - a;
    const promedio = resultado / horas;

    // Encontrar el valor pico de r(t) en el intervalo
    let pico = 0;
    for (let t = a; t <= b; t += 0.01) {
        const val = evaluarPolinomio(estado.coeficientes, t);
        if (val > pico) pico = val;
    }

    // Mostrar resultado con animación de contador
    const resultadoBox = document.getElementById('resultadoBox');
    if (resultadoBox) resultadoBox.style.display = 'block';
    animarContador('resultadoValor', resultado, 0);

    // Estadísticas
    animarContador('statTotal', resultado, 0);
    animarContador('statPromedio', promedio, 0);
    animarContador('statPico', pico, 0);

    const r2El = document.getElementById('statR2');
    if (r2El) r2El.textContent = (estado.r2 * 100).toFixed(1) + '%';

    // Texto de interpretación
    const interpEl = document.getElementById('interpretacionTexto');
    if (interpEl) {
        interpEl.innerHTML = `
            <p>El resultado de la integral definida indica que el servidor API de <strong>ShopFlow</strong>
            procesó aproximadamente <strong>${Math.round(resultado).toLocaleString()} solicitudes</strong>
            durante las <strong>${horas} horas</strong> de operación (de ${DATOS.horas[a] || a + ':00'} a ${DATOS.horas[b] || b + ':00'}).</p>
            <p>Esto equivale a un promedio de <strong>${Math.round(promedio)} solicitudes por hora</strong>.
            La tasa máxima registrada por el modelo fue de <strong>${Math.round(pico)} solicitudes/hora</strong>.</p>
            <p>En un contexto real, esta información permitiría al equipo de infraestructura
            <strong>dimensionar correctamente los recursos del servidor</strong>, asegurando que pueda
            manejar la carga sin degradar el rendimiento, y <strong>estimar los costos</strong> asociados
            al procesamiento de solicitudes en plataformas cloud.</p>
        `;
    }
}

/** Animación de contador numérico */
function animarContador(elementId, valorFinal, decimales) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const duracion = 1500;
    const inicio = performance.now();
    const valorInicio = 0;

    function actualizar(ahora) {
        const progreso = Math.min((ahora - inicio) / duracion, 1);
        // Easing ease-out
        const eased = 1 - Math.pow(1 - progreso, 3);
        const valorActual = valorInicio + (valorFinal - valorInicio) * eased;

        el.textContent = Math.round(valorActual).toLocaleString();

        if (progreso < 1) {
            requestAnimationFrame(actualizar);
        } else {
            // Valor final exacto
            el.textContent = decimales > 0
                ? valorFinal.toFixed(decimales)
                : Math.round(valorFinal).toLocaleString();
        }
    }

    requestAnimationFrame(actualizar);
}

// ============================================
// 6. INTERACTIVIDAD Y EVENTOS
// ============================================

/** Maneja el cambio de grado del polinomio */
function configurarSelectorGrado() {
    document.querySelectorAll('.degree-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Actualizar estado visual
            document.querySelectorAll('.degree-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Recalcular con nuevo grado
            estado.grado = parseInt(btn.dataset.degree);
            calcularRegresion();
            crearGraficaRegresion();
            renderizarFormulas();
        });
    });
}

/** Calcula la regresión con el grado actual */
function calcularRegresion() {
    estado.coeficientes = regresionPolinomial(DATOS.tiempo, DATOS.solicitudes, estado.grado);
    estado.r2 = calcularR2(DATOS.tiempo, DATOS.solicitudes, estado.coeficientes);

    // Actualizar badge de R²
    const r2El = document.getElementById('r2Value');
    if (r2El) r2El.textContent = estado.r2.toFixed(6);
}

/** Configura el botón de calcular integral */
function configurarBotonIntegral() {
    const btn = document.getElementById('btnCalcular');
    if (!btn) return;

    btn.addEventListener('click', () => {
        const a = parseFloat(document.getElementById('limiteA').value) || 0;
        const b = parseFloat(document.getElementById('limiteB').value) || 8;

        if (a >= b) {
            alert('El límite inferior debe ser menor que el superior.');
            return;
        }

        // Calcular y mostrar
        mostrarProcedimiento(a, b);
        crearGraficaIntegral(a, b);
        mostrarResultado(a, b);
    });
}

// ============================================
// 7. ANIMACIONES DE SCROLL
// ============================================

/** Activa animaciones al hacer scroll (Intersection Observer) */
function iniciarAnimacionesScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

/** Actualiza el enlace activo en la navegación según la sección visible */
function iniciarNavegacionActiva() {
    const secciones = document.querySelectorAll('section');
    const enlaces = document.querySelectorAll('.nav-links a');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                enlaces.forEach(a => {
                    a.classList.toggle('active', a.getAttribute('href') === '#' + id);
                });
            }
        });
    }, { threshold: 0.3 });

    secciones.forEach(sec => observer.observe(sec));
}

// ============================================
// 8. INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Calcular regresión inicial (grado 3)
    calcularRegresion();

    // Renderizar tabla de datos
    renderizarTabla();

    // Crear gráficas
    crearGraficaDispersion();
    crearGraficaRegresion();

    // Esperar a que KaTeX cargue para renderizar fórmulas
    const esperarKatex = setInterval(() => {
        if (typeof katex !== 'undefined') {
            clearInterval(esperarKatex);
            renderizarFormulas();
        }
    }, 100);

    // Configurar interactividad
    configurarSelectorGrado();
    configurarBotonIntegral();

    // Iniciar animaciones
    iniciarAnimacionesScroll();
    iniciarNavegacionActiva();

    // Calcular integral automáticamente al cargar
    setTimeout(() => {
        const btn = document.getElementById('btnCalcular');
        if (btn) btn.click();
    }, 500);
});
