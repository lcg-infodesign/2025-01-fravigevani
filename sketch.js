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
const Y_MARGIN = 50;
const DATA_MIN = -100;
const DATA_MAX = 100;

// Colori distinti
const COLUMN_COLORS_VIVID = [
    [255, 0, 0],    // Rosso per Colonna 0
    [0, 255, 0],    // Verde per Colonna 1
    [0, 60, 255],  // Blu per Colonna 2
    [255, 200, 0],  // Arancione per Colonna 3
    [255, 0, 255]   // Magenta per Colonna 4
];
const COLOR_FADE_AMOUNT = 0.10; // Opacità ridotta per i pallini deselezionati

// Variabili per il controllo hover
let hoveredValue = null;
let hoveredX = 0;
let hoveredY = 0;

// Variabili per il calcolo delle Statistiche Visive
let modeValues = []; 
let medianValue = null; 

// --- Funzioni per il Caricamento e la Preparazione dei Dati ---

function preload() {
    table = loadTable('dataset.csv', 'csv', 'header');
    rulesText = loadStrings('rules.txt',);
}

function setup() {
    // La tela deve occupare tutta la finestra
    createCanvas(windowWidth, windowHeight);
    
    //viene assegnato un colore allae variabili dotColors 
    // in base a quello che c'era scritto nella const COLUMN_COLORS_VIVID
    for (let i = 0; i < NUM_COLUMNS; i++) {
        dotColors[i] = color(COLUMN_COLORS_VIVID[i]);
    }

    // verifica se esistono i dati della tabella e delle regole 
    if (table && rulesText) {
        // interpreta il testo delle regole e lo trasforma in una scrittura comprensibile 
        const rules = parseRules(rulesText);
        // verifica i dati nella tabella in base alle regole 
        // i dati verificati vengono salvati in verifeidData
        verifiedData = verifyData(table, rules);
    }
    
    // configura i bottoni 
    setupButtons();

    // seleziona l'ID del div per visualizzare i dati in basso a destra 
    statsDisplay = select('#stats-display');
    
    // sposta la modalità di disegno dell'ellisse al centro 
    // invece che negli angoli
    ellipseMode(CENTER);

    // centra verticalmente e orizzonatalmente il testo 
    textAlign(CENTER, CENTER);
    
    // aggiorna le statistiche relative alla colonna selezionata 
    updateStats(selectedCol);
}

function windowResized() {
    // permette di ingrandire e diminuire le grandezza del display 
    // in modo che il grafico si adatti 
    // senza fare scatti 
    resizeCanvas(windowWidth, windowHeight);
}

// prende l'array del file rules e lo traduce in modo comprensibile
function parseRules(rulesArray) {
    // La funzione inizia creando un oggetto vuoto rules che conterrà le regole analizzate
    const rules = {};
    // se l'array rulesArray non è definito, 
    // la funzione restituisce semplicemente l'oggetto rules vuoto, 
    // senza fare altre elaborazioni.
    if (!rulesArray) return rules; 
    // ogni linea viene ripulita con trim
    rulesArray.forEach(line => {
        line = line.trim();
        if (line.startsWith('column2 < 0')) {
            rules.column2 = { type: 'less_than', value: 0 };
        } else if (line.startsWith('column3 is integer')) {
            const match = line.match(/(\d+) <= x < (\d+)/);
            // il codice cerca di estrarre il valore minimo e massimo del range 
            // usando una regular expression (match())
            if (match) {
                rules.column3 = { type: 'range', min: parseInt(match[1]), max: parseInt(match[2]) };
            }
        }
    });
    return rules;
}

// la funzione filtra le righe dei dati che soddisfano le regole specificate 
// e restituisce un array di righe valide.
function verifyData(data, rules) {
    let verifiedRows = [];
    const headers = data.columns;
    // Se i dati non sono definiti o se non ci sono righe,
    // la funzione restituisce direttamente un array vuoto
    if (!data || data.getRowCount() === 0) return verifiedRows;

    // La funzione scorre ogni riga del dataset
    for (let i = 0; i < data.getRowCount(); i++) {
        const row = data.getRow(i);
        let isValid = true;
        
        // La funzione estrae il valore della colonna 2 come stringa, 
        // lo converte in un numero tramite parseFloat, 
        // e lo confronta con la regola definita per column2
        // se il valofre è > o = allora cambia la variabile isValid in false 
        const col2Value = parseFloat(row.getString('column2'));
        if (rules.column2 && col2Value >= rules.column2.value) {
            isValid = false;
        }

        const col3Value = parseFloat(row.getString('column3'));
        if (rules.column3) {
            // isInteger verifica che il valore di column3 sia un numero intero
            const isInteger = col3Value % 1 === 0; 
            // Verifica che il valore di column3 sia compreso nell'intervallo definito dalle regole (minimo e massimo).
            const isInRange = col3Value >= rules.column3.min && col3Value < rules.column3.max;
            // Se la riga non è un intero o se non è nel range definito, 
            // isValid viene impostato a false
            if (!isInteger || !isInRange) {
                isValid = false;
            }
        }

        // Se la riga è valida, 
        // la funzione crea un array rowValues 
        // che contiene i valori di tutte le colonne della riga.
        if (isValid) {
            const rowValues = [];
            for(let j = 0; j < NUM_COLUMNS; j++) {
                // I valori di ciascuna colonna vengono estratti tramite row.getString(headers[j]), 
                // dove headers[j] è il nome della colonna corrispondente, 
                // e poi vengono convertiti in numeri con parseFloat.
                rowValues.push(parseFloat(row.getString(headers[j]))); 
            }
            // la riga verificata viene aggiunto all'array
            verifiedRows.push(rowValues);
        }
    }
    return verifiedRows;
}

// Ogni pulsante permette di selezionare una colonna 
// e aggiornare la visualizzazione delle statistiche 
// in base alla colonna selezionata.
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
    drawVisualStatistics(); 
    drawHistogram();
    drawTooltip(); 
}

function drawAxes() {
    const plotWidth = width - X_MARGIN_LEFT - X_BUTTON_AREA_WIDTH; 
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

function drawVisualStatistics() {
    if (selectedCol === -1 || verifiedData.length === 0) return;

    const colValues = verifiedData.map(row => row[selectedCol]);
    const plotWidth = width - X_MARGIN_LEFT - X_BUTTON_AREA_WIDTH; 
    const plotRightEdge = width - X_BUTTON_AREA_WIDTH; 
    
    const mean = calculateMean(colValues);
    const stdDev = calculateStdDev(colValues);

    const yMean = map(mean, DATA_MIN, DATA_MAX, height - Y_MARGIN, Y_MARGIN);
    
    // Impostazioni per Etichette
    fill(255);
    noStroke();
    textSize(14);
    textAlign(LEFT, CENTER);

    // 1. Linea della Media (Colonna 0 e Colonna 4)
    if (selectedCol === 0 || selectedCol === 4) {
        stroke(255); // Linea bianca
        strokeWeight(2);
        line(X_MARGIN_LEFT, yMean, plotRightEdge, yMean);
        
        // Etichetta della media
        text(`Media: ${nf(mean, 0, 2)}`, X_MARGIN_LEFT + 5, yMean - 10);
    }

    // 2. Zona della Deviazione Standard (Colonna 1 e Colonna 4)
    if (selectedCol === 1 || selectedCol === 4) {
        // Calcola i limiti dell'area (Media ± 1 Deviazione Standard)
        const meanPlusStd = mean + stdDev;
        const meanMinusStd = mean - stdDev;

        const yTop = map(meanPlusStd, DATA_MIN, DATA_MAX, height - Y_MARGIN, Y_MARGIN);
        const yBottom = map(meanMinusStd, DATA_MIN, DATA_MAX, height - Y_MARGIN, Y_MARGIN);
        
        // Disegna l'area
        noStroke();
        fill(255, 255, 255, 40); // Bianco semi-trasparente (sfumato)
        rectMode(CORNER);
        rect(X_MARGIN_LEFT, yTop, plotWidth, yBottom - yTop);
        
        // Disegna una linea sottile per la deviazione standard per chiarezza
        stroke(255, 100); 
        strokeWeight(1);
        line(X_MARGIN_LEFT, yTop, plotRightEdge, yTop);
        line(X_MARGIN_LEFT, yBottom, plotRightEdge, yBottom);

        // ETICHETTE DEVIAZIONE STANDARD
        fill(255);
        text(`+1σ: ${nf(meanPlusStd, 0, 2)}`, X_MARGIN_LEFT + 5, yTop - 10);
        text(`-1σ: ${nf(meanMinusStd, 0, 2)}`, X_MARGIN_LEFT + 5, yBottom + 10);
    }

    // 3. Linea Mediana (Colonna 3)
    if (selectedCol === 3 && medianValue !== null && medianValue !== "N/A") {
        const yMedian = map(medianValue, DATA_MIN, DATA_MAX, height - Y_MARGIN, Y_MARGIN);
        
        stroke(255); // Linea bianca
        strokeWeight(2);
        
        // Disegna la linea tratteggiata (implementazione manuale del tratteggio)
        let dashLength = 10;
        for (let x = X_MARGIN_LEFT; x < plotRightEdge; x += dashLength * 2) {
            line(x, yMedian, min(x + dashLength, plotRightEdge), yMedian);
        }
        
        // Etichetta della mediana
        fill(255);
        noStroke();
        textAlign(LEFT, CENTER);
        text(`Mediana: ${nf(medianValue, 0, 2)}`, X_MARGIN_LEFT + 5, yMedian + 10);
    }

    // 4. Etichetta Moda (Colonna 2)
    if (selectedCol === 2 && modeValues.length > 0) {
        fill(255);
        noStroke();
        textAlign(CENTER, CENTER);
        // Posiziona l'etichetta al centro del grafico
        const xCenter = X_MARGIN_LEFT + plotWidth / 2;
        const yCenter = Y_MARGIN + (height - 2 * Y_MARGIN) / 2;
        
        text(`Moda: ${modeValues.join(', ')}`, xCenter, yCenter);
        // Aggiunge una seconda riga se ci sono molti valori
        if (modeValues.length > 3) {
             text(`(Valori evidenziati con cerchi)`, xCenter, yCenter + 20);
        } else {
             text(`(Valori evidenziati con cerchi)`, xCenter, yCenter + 20);
        }
    }
}

function mouseMoved() {
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

function drawModeHighlights() {
    // Disegna cerchi concentrici intorno ai pallini che sono la moda (solo Colonna 2)
    if (selectedCol !== 2 || modeValues.length === 0 || verifiedData.length === 0) return;

    const plotWidth = width - X_MARGIN_LEFT - X_BUTTON_AREA_WIDTH; 
    const numRows = verifiedData.length;
    const xStep = plotWidth / numRows; 

    // Colore per la modalità (più chiaro e semitrasparente rispetto al colore della colonna 2)
    let modeColor = color(COLUMN_COLORS_VIVID[2]);
    modeColor.setAlpha(150); 
    modeColor = lerpColor(modeColor, color(255), 0.5); // Rende il colore più chiaro
    
    stroke(modeColor);
    strokeWeight(2);
    noFill();
    
    verifiedData.forEach((row, rowIndex) => {
        const value = row[2];
        // Nota: nf(value, 0, 0) arrotonda al numero intero più vicino.
        const roundedValue = nf(value, 0, 0); 
        
        // Controlla se il valore, arrotondato, è uno dei valori modali salvati come stringhe arrotondate
        if (modeValues.includes(roundedValue)) {
            const xPos = X_MARGIN_LEFT + xStep * 0.5 + rowIndex * xStep;
            const yPos = map(value, DATA_MIN, DATA_MAX, height - Y_MARGIN, Y_MARGIN);
            
            // Cerchio concentrico più grande del pallino
            ellipse(xPos, yPos, DOT_RADIUS * 2 * 1.8);
        }
    });
}


function drawHistogram() {
    const plotWidth = width - X_MARGIN_LEFT - X_BUTTON_AREA_WIDTH; 
    const dotRadius = DOT_RADIUS;
    const numRows = verifiedData.length;

    const xStep = plotWidth / numRows; 
    
    // Azzera hoveredValue all'inizio di ogni frame per un aggiornamento pulito
    hoveredValue = null; 

    drawModeHighlights(); // Disegna i cerchi della moda

    verifiedData.forEach((row, rowIndex) => {
        const xPos = X_MARGIN_LEFT + xStep * 0.5 + rowIndex * xStep;

        for (let j = 0; j < NUM_COLUMNS; j++) {
            const value = row[j];
            
            const yPos = map(value, DATA_MIN, DATA_MAX, height - Y_MARGIN, Y_MARGIN);

            // Controllo del mouse per il tooltip
            const d = dist(mouseX, mouseY, xPos, yPos);
            if (d < dotRadius) {
                if (selectedCol === -1 || selectedCol === j) {
                    hoveredValue = `Col. ${j}: ${nf(value, 0, 0)}`; 
                    hoveredX = xPos;
                    hoveredY = yPos;
                }
            }

            // Determina il colore e l'opacità per il disegno
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
        push();
        textSize(14);
        const padding = 5;
        // Calcola la larghezza del testo
        const textW = textWidth(hoveredValue);
        const tipWidth = textW + 2 * padding;
        const tipHeight = 20 + 2 * padding; // Altezza fissa del riquadro (30px)
        const offset = DOT_RADIUS + 3; // Spazio tra pallino e riquadro

        // Calcola la posizione Y (centrata sul pallino)
        const tipY_top = hoveredY - tipHeight / 2;
        
        let tipX;

        // 1. Posizionamento preferito: a sinistra del pallino
        let desiredTipX = hoveredX - tipWidth - offset;
        
        const plotLeftEdge = X_MARGIN_LEFT;

        if (desiredTipX < plotLeftEdge) {
            // 2. Se va fuori dal margine sinistro, sposta a destra
            tipX = hoveredX + offset;
        } else {
            // 3. Altrimenti, usa il posizionamento a sinistra
            tipX = desiredTipX;
        }

        // Sfondo del tooltip (riquadro)
        fill(255); // Riquadro bianco
        noStroke();
        rectMode(CORNER);
        rect(tipX, tipY_top, tipWidth, tipHeight, 5); 

        // Testo del tooltip
        fill(0); // Testo nero
        textSize(14);
        textAlign(LEFT, TOP);
        text(hoveredValue, tipX + padding, tipY_top + padding);
        pop();
    }
}

// --- Funzioni per le Statistiche ---

function calculateMean(arr) {
    if (arr.length === 0) return 0;
    const sum = arr.reduce((a, b) => a + b, 0);
    return sum / arr.length;
}

function calculateStdDev(arr) {
    if (arr.length <= 1) return 0;
    const mean = calculateMean(arr);
    const squaredDifferences = arr.map(val => pow(val - mean, 2));
    const variance = squaredDifferences.reduce((a, b) => a + b, 0) / (arr.length - 1); 
    return sqrt(variance);
}

function calculateMode(arr) {
    if (arr.length === 0) return [];
    const counts = {};
    arr.forEach(val => {
        const roundedVal = nf(val, 0, 0); 
        counts[roundedVal] = (counts[roundedVal] || 0) + 1;
    });

    let maxCount = 0;
    let mode = [];
    
    for (const key in counts) {
        const count = counts[key];
        if (count > maxCount) {
            maxCount = count;
            mode = [key];
        } else if (count === maxCount && maxCount > 1) { 
            mode.push(key);
        }
    }
    
    if (maxCount <= 1) {
        return [];
    }
    
    return mode; // Ritorna un array di stringhe arrotondate
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
    modeValues = []; // Resetta i valori modali
    medianValue = null; // Resetta il valore mediano

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
                modeValues = calculateMode(colValues); // Calcola e salva la moda
                if (modeValues.length > 0) {
                     statsHtml += `Moda: ${modeValues.join(', ')}`;
                } else {
                    statsHtml += `Moda: Nessuna moda significativa`;
                }
                break;
            case 3:
                medianValue = calculateMedian(colValues); // Calcola e salva la mediana
                statsHtml += `Mediana: ${nf(medianValue, 0, 2)}`;
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