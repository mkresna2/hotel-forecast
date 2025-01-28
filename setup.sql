CREATE DATABASE IF NOT EXISTS hotel_forecasting;
USE hotel_forecasting;

CREATE TABLE datasets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE occupancy_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dataset_id INT,
    date DATE NOT NULL,
    occupancy FLOAT NOT NULL,
    holiday BOOLEAN NOT NULL,
    event BOOLEAN NOT NULL,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id)
);

CREATE TABLE tuning_configs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dataset_id INT,
    lstm_units INT,
    learning_rate FLOAT,
    sequence_length INT,
    test_loss FLOAT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id)
);

CREATE TABLE prediction_scenarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tuning_config_id INT,
    prediction_data JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tuning_config_id) REFERENCES tuning_configs(id)
);