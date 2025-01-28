const express = require('express');
const tf = require('@tensorflow/tfjs-node');
const mysql = require('mysql2/promise');
const multer = require('multer');
const cors = require('cors');
const xlsx = require('xlsx');
const { Readable } = require('stream');
const csv = require('csv-parser');

const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hotel_forecasting',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function parseFile(file) {
    const results = [];
    
    if (file.mimetype === 'text/csv') {
        const buffer = Readable.from(file.buffer.toString());
        await new Promise((resolve) => {
            buffer.pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', resolve);
        });
    } else {
        const workbook = xlsx.read(file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        results.push(...xlsx.utils.sheet_to_json(sheet));
    }
    
    return results;
}

app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        const data = await parseFile(req.file);
        const [dataset] = await pool.execute(
            'INSERT INTO datasets (filename) VALUES (?)',
            [req.file.originalname]
        );
        
        const datasetId = dataset.insertId;
        const values = data.map(row => [
            datasetId,
            new Date(row.Date),
            row.Occupancy,
            row.Holiday ? 1 : 0,
            row.Event ? 1 : 0
        ]);
        
        await pool.query(
            'INSERT INTO occupancy_data (dataset_id, date, occupancy, holiday, event) VALUES ?',
            [values]
        );

        res.json({ success: true, datasetId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'File processing failed' });
    }
});

app.post('/api/tune', async (req, res) => {
    try {
        const { datasetId, params } = req.body;
        const [data] = await pool.execute(
            'SELECT * FROM occupancy_data WHERE dataset_id = ? ORDER BY date',
            [datasetId]
        );
        
        const results = [];
        for (const units of params.lstmUnits) {
            for (const lr of params.learningRates) {
                for (const seqLen of params.sequenceLengths) {
                    const testLoss = await trainModel(data, { units, lr, seqLen });
                    const [config] = await pool.execute(
                        'INSERT INTO tuning_configs SET ?',
                        { dataset_id: datasetId, lstm_units: units, 
                          learning_rate: lr, sequence_length: seqLen, test_loss: testLoss }
                    );
                    results.push({ id: config.insertId, units, lr, seqLen, testLoss });
                }
            }
        }
        
        res.json({ results });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Tuning failed' });
    }
});

async function trainModel(data, config) {
    const trainingData = data.map(row => [
        row.occupancy,
        row.holiday,
        row.event
    ]);
    
    const { X, y } = createSequences(trainingData, config.seqLen);
    const XTensor = tf.tensor3d(X, [X.length, config.seqLen, 3]);
    const yTensor = tf.tensor2d(y, [y.length, 1]);

    const model = tf.sequential();
    model.add(tf.layers.lstm({
        units: config.units,
        inputShape: [config.seqLen, 3]
    }));
    model.add(tf.layers.dense({ units: 1 }));
    model.compile({
        optimizer: tf.train.adam(config.lr),
        loss: 'meanSquaredError'
    });

    await model.fit(XTensor, yTensor, {
        epochs: 50,
        batchSize: 32,
        verbose: 0
    });

    const loss = model.evaluate(XTensor, yTensor).dataSync()[0];
    tf.dispose([XTensor, yTensor]);
    return loss;
}

function createSequences(data, sequenceLength) {
    const X = [];
    const y = [];
    for (let i = 0; i < data.length - sequenceLength; i++) {
        X.push(data.slice(i, i + sequenceLength));
        y.push(data[i + sequenceLength][0]);
    }
    return { X, y };
}

app.post('/api/predict', async (req, res) => {
    try {
        const { configId, scenario } = req.body;
        const [config] = await pool.execute(
            'SELECT * FROM tuning_configs WHERE id = ?',
            [configId]
        );
        const [data] = await pool.execute(
            'SELECT * FROM occupancy_data WHERE dataset_id = ? ORDER BY date',
            [config[0].dataset_id]
        );

        const modifiedData = applyScenario(data, scenario);
        const predictions = await generatePredictions(modifiedData, config[0]);
        
        res.json({
            historical: data.map(d => d.occupancy),
            predictions,
            dates: data.map(d => d.date),
            confidence: predictions.map(p => ({
                upper: p * 1.1,
                lower: p * 0.9
            }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Prediction failed' });
    }
});

function applyScenario(data, scenario) {
    return data.map(row => ({
        ...row,
        occupancy: row.occupancy * (1 + scenario.seasonality),
        event: scenario.specialEvent ? 1 : row.event
    }));
}

async function generatePredictions(data, config) {
    const { X } = createSequences(data, config.sequence_length);
    const model = await buildModel(config);
    const predictions = model.predict(tf.tensor3d(X)).dataSync();
    return Array.from(predictions);
}

async function buildModel(config) {
    const model = tf.sequential();
    model.add(tf.layers.lstm({
        units: config.lstm_units,
        inputShape: [config.sequence_length, 3]
    }));
    model.add(tf.layers.dense({ units: 1 }));
    model.compile({
        optimizer: tf.train.adam(config.learning_rate),
        loss: 'meanSquaredError'
    });
    return model;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));