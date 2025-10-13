// Variabili globali per P5.js e i dati
let table;
let rulesText;
let verifiedData = [];
let dotColors = [];
let buttons = [];
let selectedCol = -1; // -1 significa nessuna colonna selezionata
let statsDisplay;
const NUM_COLUMNS = 5;

// Costanti di Disegno
const DOT_RADIUS = 8; 
const X_MARGIN_LEFT = 50; 
const X_BUTTON_AREA_WIDTH = 180; // Larghezza riservata ai bottoni (150px width + padding)
const X_MARGIN_RIGHT = X_BUTTON_AREA_WIDTH; // Il margine destro è l'area dei bottoni + un piccolo buffer (lo gestiamo in drawAxes)
const Y_MARGIN = 50;
const DATA_MIN = -100;
const DATA_MAX = 100;

// Colori distinti
const COLUMN_COLORS_VIVID = [
    [255, 0, 0],    // Rosso per Colonna 0
    [0, 255, 0],    // Verde per Colonna 1
    [0, 150, 255],  // Blu per Colonna 2
    [255, 200, 0],  // Arancio per Colonna 3
    [255, 0, 255]   // Magenta per Colonna 4
];
const COLOR_FADE_AMOUNT = 0.10; // Opacità ridotta per i pallini deselezionati

// Variabili per il controllo hover
let hoveredValue = null;
let hoveredX = 0;
let hoveredY = 0;

// --- Funzioni per il Caricamento e la Preparazione dei Dati ---

function preload() {
    table = loadTable('dataset.csv', 'csv', 'header', 
        () => console.log('Dataset caricato con successo.'), 
        () => console.error('Errore nel caricamento del dataset.'));
    
    rulesText = loadStrings('rules.txt',
        () => console.log('Regole caricate con successo.'), 
        () => console.error('Errore nel caricamento delle regole.'));
}

function setup() {
    // La tela deve occupare tutta la finestra
    createCanvas(windowWidth, windowHeight);
    
    noLoop(); 
    
    for (let i = 0; i < NUM_COLUMNS; i++) {
        dotColors[i] = color(COLUMN_COLORS_VIVID[i]);
    }

    if (table && rulesText) {
        const rules = parseRules(rulesText);
        verifiedData = verifyData(table, rules);
    }
    
    setupButtons();

    statsDisplay = select('#stats-display');
    
    ellipseMode(CENTER);
    textAlign(CENTER, CENTER);
    
    redraw(); 
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    redraw(); 
}

function parseRules(rulesArray) {
    const rules = {};
    if (!rulesArray) return rules; 
    rulesArray.forEach(line => {
        line = line.trim();
        if (line.startsWith('column2 < 0')) {
            rules.column2 = { type: 'less_than', value: 0 };
        } else if (line.startsWith('column3 is integer')) {
            const match = line.match(/(\d+) <= x < (\d+)/);
            if (match) {
                rules.column3 = { type: 'range', min: parseInt(match[1]), max: parseInt(match[2]) };
            }
        }
    });
    return rules;
}

function verifyData(data, rules) {
    let verifiedRows = [];
    const headers = data.columns;
    if (!data || data.getRowCount() === 0) return verifiedRows;

    for (let i = 0; i < data.getRowCount(); i++) {
        const row = data.getRow(i);
        let isValid = true;
        
        const col2Value = parseFloat(row.getString('column2'));
        if (rules.column2 && col2Value >= rules.column2.value) {
            isValid = false;
        }

        const col3Value = parseFloat(row.getString('column3'));
        if (rules.column3) {
            const isInteger = col3Value % 1 === 0; 
            const isInRange = col3Value >= rules.column3.min && col3Value < rules.column3.max;
            if (!isInteger || !isInRange) {
                isValid = false;
            }
        }

        if (isValid) {
            const rowValues = [];
            for(let j = 0; j < NUM_COLUMNS; j++) {
                rowValues.push(parseFloat(row.getString(headers[j]))); 
            }
            verifiedRows.push(rowValues);
        }
    }
    return verifiedRows;
}

function setupButtons() {
    const container = select('#buttons-container');
    
    for (let i = 0; i < NUM_COLUMNS; i++) {
        const colName = 'Colonna ' + i;
        const button = createButton(colName);
        button.parent(container); 
        button.mousePressed(() => {
            selectedCol = (selectedCol === i) ? -1 : i; 
            
            updateStats(selectedCol);
            
            redraw(); 
        });
        buttons.push(button);
        button.style('background-color', `rgb(${COLUMN_COLORS_VIVID[i].join(',')}, 0.2)`);
    }
}

// --- Funzioni per il Disegno ---

function draw() {
    background(0); 

    if (!verifiedData || verifiedData.length === 0) {
        fill(255);
        textSize(24);
        text("Nessuna riga verificata o dati non caricati.", width / 2, height / 2);
        return;
    }

    drawAxes();
    drawHistogram();
    drawTooltip();
}

function drawAxes() {
    // La larghezza del grafico è data dalla larghezza totale meno i margini laterali fissi
    const plotWidth = width - X_MARGIN_LEFT - X_BUTTON_AREA_WIDTH; 

    // L'estremo destro del grafico
    const plotRightEdge = width - X_BUTTON_AREA_WIDTH; 

    // Asse Y (Valore)
    stroke(50); 
    line(X_MARGIN_LEFT, Y_MARGIN, X_MARGIN_LEFT, height - Y_MARGIN);
    
    // Etichette Y
    textAlign(RIGHT, CENTER);
    fill(255);
    textSize(15);
    text(DATA_MAX, X_MARGIN_LEFT - 5, Y_MARGIN);
    text(DATA_MIN, X_MARGIN_LEFT - 5, height - Y_MARGIN);
    push();
    translate(X_MARGIN_LEFT - 35, height / 2);
    rotate(-HALF_PI);
    text("Valore", 0, 0);
    pop();
    
    // Asse X (Indice riga verificata)
    stroke(50); 
    line(X_MARGIN_LEFT, height - Y_MARGIN, plotRightEdge, height - Y_MARGIN);
    
    // Etichette X (Righe)
    textAlign(CENTER, TOP);
    const numRows = verifiedData.length;
    const xStep = plotWidth / numRows; 
    
    // Etichetta iniziale (riga 1)
    text("1", X_MARGIN_LEFT + xStep / 2, height - Y_MARGIN + 5);
    
    // Etichetta finale (ultima riga)
    text(numRows, plotRightEdge - xStep / 2, height - Y_MARGIN + 5);
    
    // Etichetta Asse X
    textAlign(CENTER, TOP);
    text("Riga Verificata", X_MARGIN_LEFT + plotWidth / 2, height - Y_MARGIN + 25);
}


function mouseMoved() {
    // Limita il loop di disegno solo all'area del grafico
    const plotRightEdge = width - X_BUTTON_AREA_WIDTH;
    if (mouseX > X_MARGIN_LEFT && mouseX < plotRightEdge && mouseY > Y_MARGIN && mouseY < height - Y_MARGIN) {
        if (looping() === false) {
             loop(); 
        }
    } else {
        if (looping() === true) {
            noLoop(); 
            redraw(); 
        }
    }
}


function drawHistogram() {
    // Larghezza del grafico
    const plotWidth = width - X_MARGIN_LEFT - X_BUTTON_AREA_WIDTH; 
    const dotRadius = DOT_RADIUS;
    const numRows = verifiedData.length;

    const xStep = plotWidth / numRows; 
    
    hoveredValue = null;

    verifiedData.forEach((row, rowIndex) => {
        // Posizione X: Margine Sinistro + metà del primo step + (indice * step)
        const xPos = X_MARGIN_LEFT + xStep * 0.5 + rowIndex * xStep;

        for (let j = 0; j < NUM_COLUMNS; j++) {
            const value = row[j];
            
            const yPos = map(value, DATA_MIN, DATA_MAX, height - Y_MARGIN, Y_MARGIN);

            // Controllo del mouse per il tooltip
            const d = dist(mouseX, mouseY, xPos, yPos);
            if (d < dotRadius) {
                if (selectedCol === -1 || selectedCol === j) {
                    hoveredValue = `Riga ${rowIndex + 1}, Col. ${j}: ${nf(value, 0, 0)}`; 
                    hoveredX = xPos;
                    hoveredY = yPos;
                }
            }

            // Determina il colore e l'opacità per il disegno (Senza contorno)
            let col = dotColors[j];
            if (selectedCol === -1 || selectedCol === j) {
                col.setAlpha(255); 
            } else {
                col.setAlpha(255 * COLOR_FADE_AMOUNT); 
            }
            
            noStroke(); 
            fill(col);
            ellipse(xPos, yPos, dotRadius * 2);
        }
    });
}

function drawTooltip() {
    if (hoveredValue) {
        const tipX = hoveredX + DOT_RADIUS + 5;
        const tipY = hoveredY - 20;
        
        const padding = 5;
        push();
        textSize(14);
        const textW = textWidth(hoveredValue);
        pop(); 

        // Sfondo del tooltip
        fill(50, 50, 50, 240); 
        noStroke();
        rectMode(CORNER);
        rect(tipX, tipY - 15, textW + 2 * padding, 20 + 2 * padding, 5); 

        // Testo del tooltip
        fill(255);
        textSize(14);
        textAlign(LEFT, TOP);
        text(hoveredValue, tipX + padding, tipY - 15 + padding);
    }
}

// --- Funzioni per le Statistiche (rimangono invariate) ---

function calculateMean(arr) {
    if (arr.length === 0) return 0;
    const sum = arr.reduce((a, b) => a + b, 0);
    return sum / arr.length;
}

function calculateStdDev(arr) {
    if (arr.length <= 1) return 0;
    const mean = calculateMean(arr);
    const squaredDifferences = arr.map(val => pow(val - mean, 2));
    const variance = calculateMean(squaredDifferences) * (arr.length / (arr.length - 1));
    return sqrt(variance);
}

function calculateMode(arr) {
    if (arr.length === 0) return "N/A";
    const counts = {};
    arr.forEach(val => {
        counts[val] = (counts[val] || 0) + 1;
    });

    let maxCount = 0;
    let mode = [];
    
    for (const key in counts) {
        const count = counts[key];
        if (count > maxCount) {
            maxCount = count;
            mode = [parseFloat(key)];
        } else if (count === maxCount) {
            mode.push(parseFloat(key));
        }
    }
    
    if (maxCount === 1 && arr.length > 1) {
        return "Nessuna moda significativa (o unimodale)";
    }
    
    return mode.map(v => nf(v, 0, 0)).join(', ');
}

function calculateMedian(arr) {
    if (arr.length === 0) return "N/A";
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
        return sorted[mid];
    }
}

function updateStats(colIndex) {
    if (colIndex === -1) {
        statsDisplay.html('Statistiche: Seleziona una Colonna');
        return;
    }

    const colValues = verifiedData.map(row => row[colIndex]);
    let statsHtml = `<b>Statistiche Colonna ${colIndex}:</b><br>`;

    if (colValues.length === 0) {
        statsHtml += 'Nessun dato verificato per questa colonna.';
    } else {
        switch (colIndex) {
            case 0:
                const mean0 = calculateMean(colValues);
                statsHtml += `Media: ${nf(mean0, 0, 2)}`;
                break;
            case 1:
                const stdDev1 = calculateStdDev(colValues);
                statsHtml += `Deviazione Standard: ${nf(stdDev1, 0, 2)}`;
                break;
            case 2:
                const mode2 = calculateMode(colValues);
                statsHtml += `Moda: ${mode2}`;
                break;
            case 3:
                const median3 = calculateMedian(colValues);
                statsHtml += `Mediana: ${nf(median3, 0, 2)}`;
                break;
            case 4:
                const mean4 = calculateMean(colValues);
                const stdDev4 = calculateStdDev(colValues);
                statsHtml += `Media: ${nf(mean4, 0, 2)}<br>`;
                statsHtml += `Deviazione Standard: ${nf(stdDev4, 0, 2)}`;
                break;
        }
    }

    statsDisplay.html(statsHtml);
}