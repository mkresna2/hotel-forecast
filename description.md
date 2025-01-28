1. npm install @tensorflow/tfjs-node @tensorflow/tfjs csv-parser fs express

4. System Architecture
```
Frontend (Browser)           Backend (Node.js)            Database (MySQL)
     |                             |                             |
     | Upload CSV/XLSX file        |                             |
     | --------------------------> |                             |
     |                             | Parse file                  |
     |                             | Store in MySQL              |
     |                             | Train model                 |
     |                             | Make predictions            |
     |                             | Store predictions           |
     |                             |                             |
     | <-------------------------- | Return JSON with predictions|
     | Display chart               |                             |
```

5. Running the System
    1. Start MySQL server
    2. Run the Node.js backend: <br>
    ``` node server.js ```

    3. Open the frontend HTML file in a browser

    4. Upload a CSV/XLSX file with columns:
        * Date (YYYY-MM-DD)
        * Occupancy (0-1)
        * Holiday (0/1)
        * Event (0/1)

Here's a detailed description of each UI control and its role in the hotel forecasting scenario simulation:

---

### **1. LSTM Units**  
**Control Type**: Range Slider (16-256 units)  
**Function**:  
- Determines the number of memory cells/nodes in the LSTM layer  
- Controls the model's capacity to learn complex temporal patterns  

**Effect on Forecast**:  
- 🟢 **Higher Units** (128-256):  
  - Can capture intricate seasonal patterns and long-term dependencies  
  - Risks overfitting on small datasets  
  - Requires more computational resources  

- 🟡 **Moderate Units** (64-128):  
  - Balanced approach for most hotel datasets  
  - Good at capturing weekly/monthly occupancy trends  

- 🔴 **Lower Units** (16-64):  
  - Faster training times  
  - May oversimplify weekend/weekday variations  
  - Better for small datasets (<1 year of history)  

---

### **2. Learning Rate**  
**Control Type**: Dropdown (0.1, 0.01, 0.001)  
**Function**:  
- Controls how aggressively the model updates its internal parameters during training  

**Effect on Forecast**:  
- 🟢 **Higher Rate** (0.1):  
  - Faster convergence during training  
  - Risk of overshooting optimal parameters  
  - May produce unstable predictions  

- 🟡 **Medium Rate** (0.01):  
  - Default choice for most scenarios  
  - Balanced between speed and stability  

- 🔴 **Lower Rate** (0.001):  
  - Slower but more precise training  
  - Requires more epochs to converge  
  - Better for fine-tuning pre-trained models  

---

### **3. Sequence Length**  
**Control Type**: Number Input (3-30 days)  
**Function**:  
- Determines how many historical days the model considers for each prediction  

**Effect on Forecast**:  
- 🟢 **Longer Sequences** (14-30 days):  
  - Captures monthly seasonality and holiday patterns  
  - Better for resorts with weekly booking cycles  
  - Requires more training data  

- 🟡 **Medium Sequences** (7-14 days):  
  - Good for urban hotels with weekday business traffic  
  - Balances recent trends and weekly patterns  

- 🔴 **Shorter Sequences** (3-7 days):  
  - Focuses on immediate booking patterns  
  - Useful for last-minute demand prediction  
  - Misses longer-term seasonal effects  

---

### **4. Future Days**  
**Control Type**: Number Input (1-30 days)  
**Function**:  
- Sets how far into the future to generate occupancy predictions  

**Effect on Forecast**:  
- 🟢 **Short-Term** (1-7 days):  
  - High confidence predictions  
  - Useful for staff scheduling  
  - Affected by current bookings  

- 🟡 **Medium-Term** (8-14 days):  
  - Balances accuracy and planning needs  
  - Helps with inventory pricing  
  - Considers advance bookings  

- 🔴 **Long-Term** (15-30 days):  
  - Higher uncertainty  
  - Useful for revenue management  
  - Reflects seasonal/event patterns  

---

### **5. Scenario Simulation Controls**  
**Function**:  
- Allow "what-if" analysis by modifying input assumptions  

**Key Components**:  
1. **Event Toggle**  
   - Simulate impact of conferences/festivals  
   - Tests how special events affect occupancy  

2. **Seasonality Multiplier**  
   - Adjust for expected seasonal changes  
   - Example: +20% summer demand modifier  

3. **Competitor Price Influence**  
   - Slider to simulate competitor rate changes  
   - Tests price elasticity of demand  

---

### **6. Visualization Controls**  
**Function**:  
- Enable comparative analysis of different scenarios  

**Key Features**:  
1. **Prediction Horizon Selector**  
   - Focus on specific date ranges (e.g., holiday weekends)  

2. **Confidence Interval Toggle**  
   - Show/hide prediction uncertainty ranges  

3. **Scenario Overlay**  
   - Compare multiple parameter configurations  
   - Example: Compare high vs low LSTM unit scenarios  

---

### **User Workflow Explanation**  
1. **Parameter Tuning Phase**  
   - Experiment with different LSTM architectures  
   - Balance model complexity vs performance  

2. **Scenario Testing Phase**  
   - Simulate special events or market conditions  
   - Compare predicted occupancy under different assumptions  

3. **Analysis Phase**  
   - Use zoom/pan to examine critical periods  
   - Export scenarios for stakeholder review  

---

This control set allows hotel managers to:  
- Test how different booking patterns affect revenue  
- Prepare for seasonal demand fluctuations  
- Optimize staffing and pricing strategies  
- Evaluate impact of potential special events  

Each control directly corresponds to real-world operational decisions while maintaining technical relevance to the machine learning model's behavior.