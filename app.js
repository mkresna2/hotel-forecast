let chart;
let currentDatasetId;

document.getElementById('fileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const status = document.getElementById('fileStatus');
    status.textContent = `Uploading ${file.name}...`;
    
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        currentDatasetId = result.datasetId;
        status.textContent = `Upload successful! Dataset ID: ${result.datasetId}`;
    } catch (err) {
        status.textContent = 'Upload failed';
        console.error(err);
    }
});

document.getElementById('btnTune').addEventListener('click', async () => {
    const params = {
        lstmUnits: [32, 64],
        learningRates: [0.001, 0.01],
        sequenceLengths: [7, 14]
    };

    toggleButtons(true);
    
    try {
        const response = await fetch('/api/tune', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                datasetId: currentDatasetId,
                params
            })
        });
        
        const results = await response.json();
        console.log('Tuning results:', results);
    } catch (err) {
        console.error('Tuning failed:', err);
    }
    
    toggleButtons(false);
});

document.getElementById('btnPredict').addEventListener('click', async () => {
    const scenario = {
        specialEvent: document.getElementById('specialEvent').checked,
        seasonality: document.getElementById('seasonality').value / 100,
        futureDays: document.getElementById('futureDays').value
    };

    toggleButtons(true);
    
    try {
        const response = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                configId: 1, // Use first config for demo
                scenario
            })
        });
        
        const result = await response.json();
        updateChart(result);
    } catch (err) {
        console.error('Prediction failed:', err);
    }
    
    toggleButtons(false);
});

function updateChart(data) {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    
    if (chart) chart.destroy();
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [{
                label: 'Historical Occupancy',
                data: data.historical,
                borderColor: '#007bff',
                fill: false
            }, {
                label: 'Predictions',
                data: [...data.historical.slice(0, -1), ...data.predictions],
                borderColor: '#ff6384',
                borderDash: [5, 5],
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                zoom: {
                    zoom: {
                        wheel: { enabled: true },
                        pinch: { enabled: true },
                        mode: 'x'
                    }
                }
            }
        }
    });
}

function toggleButtons(disabled) {
    document.querySelectorAll('.btn').forEach(btn => {
        btn.disabled = disabled;
    });
}

// Update parameter displays
document.getElementById('lstmUnits').addEventListener('input', (e) => {
    document.getElementById('unitsValue').textContent = e.target.value;
});

document.getElementById('seasonality').addEventListener('input', (e) => {
    document.getElementById('seasonalityValue').textContent = e.target.value;
});