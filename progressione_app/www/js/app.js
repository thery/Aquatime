import { StatusBar } from '@capacitor/status-bar';
import { Network } from '@capacitor/network';


// Wait for the device to be ready
document.addEventListener('DOMContentLoaded', onDeviceReady, false);

// Capacitor initialization function
function onDeviceReady() {
    // At the beginning of your onDeviceReady function:
    try {
        StatusBar.setBackgroundColor({ color: '#6699ff' });
    } catch (err) {
        console.error('Error setting status bar color:', err);
    }
    console.log('Progressione app is ready!');
    initializeApp();
    // In your onDeviceReady function:
    Network.addListener('networkStatusChange', status => {
        if (!status.connected) {
            document.getElementById('error').style.display = 'block';
            document.getElementById('error').textContent = 'Nessuna connessione Internet';
        } else {
            document.getElementById('error').style.display = 'none';
        }
    });

    // Check initial network status
    Network.getStatus().then(status => {
        if (!status.connected) {
            document.getElementById('error').style.display = 'block';
            document.getElementById('error').textContent = 'Nessuna connessione Internet';
        }
    });
}

function initializeApp() {
    var debug = false;
    // Update to use relative paths or full URLs to your backend
    var search_script = 'https://www.aquatime.it/APILT/serch.php';
    var progress_script = 'https://www.aquatime.it/APILT/progress.php';

    // Create a mapping of event IDs to event names
    const eventNames = {
        "36": "50 stile",
        "32": "100 stile",
        "40": "200 stile",
        "47": "400 stile",
        "48": "800 stile",
        "49": "1500 stile",
        "37": "50 dorso",
        "33": "100 dorso",
        "41": "200 dorso",
        "38": "50 rana",
        "35": "100 rana",
        "43": "200 rana",
        "39": "50 farfalla",
        "34": "100 farfalla",
        "42": "200 farfalla",
        "44": "100 misti",
        "45": "200 misti",
        "46": "400 misti"
    };

    const categories = [
        "C1", "C2", "B1", "B2", "A1", "A2",
        "RAG1", "RAG2", "RAG3", "JUN1", "JUN2", "CAD", "SEN"
    ];

    // Default Colors for the swimmers
    var colors = [
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
        'rgb(255, 206, 86)',
        'rgb(75, 192, 192)'
    ];

    var chartInstance = null;
    let selectedAthletes = [null, null];

    function debounce(func, timeout = 500) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => { func.apply(this, args); }, timeout);
        };
    }

    var vasca = "0";
    function handleVasca(val) {
        vasca = val;
        checkSelections();
    }

    // Make handleVasca available globally
    window.handleVasca = handleVasca;

    async function searchAthletes(query, resultsDiv, athleteIndex) {
        if (query.length < 2) {
            resultsDiv.innerHTML = '';
            return;
        }

        try {
            const request = `${search_script}?AtletaSRC=${encodeURIComponent(query)}`;
            if (debug) {
                console.log('request = ' + request);
            }

            // Show loading state
            resultsDiv.innerHTML = '<div>Ricerca in corso...</div>';
            const response = await axios.get(request, { responseType: "json" });
            var athletes = response.data;

            if (!athletes || athletes.length === 0 || (athletes[0] && athletes[0].name == "Non Disponibile")) {
                resultsDiv.innerHTML = '<div>Nessun risultato trovato</div>';
            } else {
                resultsDiv.innerHTML = '';
                athletes.forEach(athlete => {
                    const div = document.createElement('div');
                    div.textContent = `${athlete.name} (${athlete.team}, ${athlete.year})`;
                    div.addEventListener('click', () => selectAthlete(athlete, athlete.id_athlete, athleteIndex));
                    resultsDiv.appendChild(div);
                });
            }
        } catch (error) {
            console.error('Error searching athletes:', error);
            resultsDiv.innerHTML = '<div>Errore durante la ricerca</div>';
        }
    }

    const debouncedSearch1 = debounce((e) => searchAthletes(e.target.value, document.getElementById('results1'), 0));
    const debouncedSearch2 = debounce((e) => searchAthletes(e.target.value, document.getElementById('results2'), 1));

    document.getElementById('search1').addEventListener('input', debouncedSearch1);
    document.getElementById('search2').addEventListener('input', debouncedSearch2);

    function selectAthlete(athlete, id, index) {
        selectedAthletes[index] = id;

        const selectedDiv = document.getElementById(`selected${index + 1}`);
        const resultsDiv = document.getElementById(`results${index + 1}`);

        selectedDiv.innerHTML = `
      <div class="selected-athlete">
        ${athlete.name} &nbsp; &nbsp;       
        <button onclick="clearAthlete(${index})">Cancella</button>
      </div>
    `;

        resultsDiv.innerHTML = '';
        document.getElementById(`search${index + 1}`).value = '';

        checkSelections();
    }

    function clearAthlete(index) {
        selectedAthletes[index] = null;
        document.getElementById(`selected${index + 1}`).innerHTML = '';
        checkSelections();
    }

    // Make clearAthlete available globally
    window.clearAthlete = clearAthlete;

    function checkSelections() {
        console.log("fkkfkfkf");
        const raceSelect = document.getElementById('raceSelect');

        if (selectedAthletes[0] && raceSelect.value) {
            const athlete1 = selectedAthletes[0];
            const athlete2 = selectedAthletes[1]; // Could be null
            const raceName = eventNames[raceSelect.value];

            const outputDiv = document.getElementById('output');
            const request = `${progress_script}?id_atl1=${athlete1}&id_atl2=${athlete2}&id_gara=${raceSelect.value}&Vasca=${vasca}`;

            if (debug) {
                console.log("request = " + request);
            }

            const loadingDiv = document.getElementById('loading');
            loadingDiv.textContent = 'Caricando...';
            loadingDiv.style.display = 'block';

            document.getElementById('error').style.display = 'none';

            fetch(request)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Problema con la rete');
                    }
                    return response.json();
                })
                .then(data => {
                    loadingDiv.style.display = 'none';
                    document.getElementById('content').style.display = 'block';
                    analyzeProgression(data[0]);
                })
                .catch(error => {
                    loadingDiv.style.display = 'none';
                    document.getElementById('error').style.display = 'block';
                    document.getElementById('error').textContent = `Errore caricando dati: ${error.message}`;
                });
        } else {
            if (chartInstance != null) {
                console.log('destroying chart');
                chartInstance.destroy();
                chartInstance = null;
                const outputDiv = document.getElementById('output');
                outputDiv.innerHTML = '';
            }
        }
    }

    document.getElementById('raceSelect').addEventListener('change', checkSelections);

    // Process the data for Chart.js
    function processData(json) {
        const swimmers = {};
        var cats = [];

        // Initialize swimmer data arrays
        for (let i = 0; i < json.legend.length; i++) {
            swimmers[i] = [];
        }

        // Process legends, the split times (data1)
        for (let i = 0; i < json.data.length; i++) {
            const entry = json.data[i][0].split(",");
            cats.push(categories[entry[0] - 1]);

            // Add legends, data for each swimmer
            for (let j = 0; j < json.legend.length; j++) {
                const time = entry[j + 1] == 0 ? null : entry[j + 1];
                swimmers[j].push(time);
            }
        }

        return [cats, swimmers];
    }

    function analyzeProgression(data) {
        let result = processData(data);

        // Generate colors for additional swimmers
        for (let i = 4; i < data.legend.length; i++) {
            var o = Math.round, r = Math.random, s = 255;
            colors.push('rgb(' + o(r() * s) + ',' + o(r() * s) + ',' + o(r() * s) + ')');
        }

        createChart(result[0], result[1], data.legend, eventNames[data.idgara]);
    }

    function formatTime(hundredths) {
        const totalSeconds = hundredths / 100;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        const remainingHundredths = hundredths % 100;

        return `${minutes.toString().padStart(2, '0')} '${seconds.toString().padStart(2, '0')}''${remainingHundredths.toString().padStart(2, '0')}`;
    }

    function createChart(cats, swimmers, legend, gara) {
        const ctx = document.getElementById('raceChart').getContext('2d');

        let datasets = [];
        let chartTitle = gara + ' vasca ' + (vasca == 0 ? '25m' : '50m');
        let yAxisLabel = 'Tempo';

        for (let i = 0; i < legend.length; i++) {
            datasets.push({
                label: legend[i],
                data: swimmers[i],
                borderColor: colors[i],
                backgroundColor: colors[i] + '33', // Add transparency
                fill: false,
                tension: 0.1
            });
        }

        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: cats,
                datasets: datasets
            },
            options: {
                spanGaps: true,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: chartTitle,
                        font: {
                            size: 18
                        }
                    },
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += formatTime(Math.round(context.parsed.y * 100)) + '';
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Categoria'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: yAxisLabel
                        },
                        ticks: {
                            callback: function (value) {
                                return formatTime(Math.round(value * 100)) + '';
                            }
                        }
                    }
                }
            }
        });
    }
}
