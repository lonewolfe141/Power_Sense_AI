/* ---------- PAGE NAVIGATION ---------- */
document.querySelectorAll(".nav li").forEach(item => {
    item.addEventListener("click", () => {
        const target = item.dataset.target;

        document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
        document.getElementById(target).classList.add("active");
    });
});

/* ---------- ASSET LIST ---------- */
let assets = [
    "WIND_TURBINE_01",
    "WIND_TURBINE_02",
    "SOLAR_INVERTER_01",
    "SOLAR_INVERTER_02",
    "BATTERY_PACK_01",
    "TRANSFORMER_HV_01"
];

function refreshAssetDropdowns() {
    document.querySelectorAll(".asset-dropdown").forEach(drop => {
        const currentValue = drop.value;
        drop.innerHTML = "";
        assets.forEach(a => {
            drop.innerHTML += `<option value="${a}">${a}</option>`;
        });

        if (assets.includes(currentValue)) {
            drop.value = currentValue;
        }
    });
}

function refreshAssetList() {
    const list = document.getElementById("assetList");
    list.innerHTML = "";

    assets.forEach(a => {
        const li = document.createElement("li");
        li.textContent = a;
        list.appendChild(li);
    });
}

refreshAssetDropdowns();
refreshAssetList();

/* ---------- ADD ASSET ---------- */
document.getElementById("addAssetBtn").addEventListener("click", () => {
    const newId = document.getElementById("newAssetName").value.trim();

    if (newId.length > 0 && !assets.includes(newId)) {
        assets.push(newId);
        refreshAssetDropdowns();
        refreshAssetList();
        document.getElementById("newAssetName").value = "";
    }
});

/* ---------- UTILS ---------- */
function generateScanId() {
    return "PSAI-" + Date.now();
}

function presetValues(assetId) {
    const presets = {
        "WIND_TURBINE_01": { voltage: 690, current: 120, temp: 65, vib: 0.32 },
        "WIND_TURBINE_02": { voltage: 700, current: 125, temp: 68, vib: 0.40 },
        "SOLAR_INVERTER_01": { voltage: 480, current: 85, temp: 52, vib: 0.10 },
        "SOLAR_INVERTER_02": { voltage: 460, current: 80, temp: 50, vib: 0.12 },
        "BATTERY_PACK_01": { voltage: 400, current: 150, temp: 40, vib: 0.05 },
        "TRANSFORMER_HV_01": { voltage: 11000, current: 250, temp: 75, vib: 0.15 }
    };
    return presets[assetId];
}

function fillFields(prefix, data) {
    if (!data) return;

    document.getElementById(prefix + "_volt").value = data.voltage;
    document.getElementById(prefix + "_curr").value = data.current;
    document.getElementById(prefix + "_temp").value = data.temp;
    document.getElementById(prefix + "_vib").value = data.vib;
}

function getFeatures(prefix) {
    return {
        voltage: parseFloat(document.getElementById(prefix + "_volt").value),
        current: parseFloat(document.getElementById(prefix + "_curr").value),
        temp: parseFloat(document.getElementById(prefix + "_temp").value),
        vib: parseFloat(document.getElementById(prefix + "_vib").value)
    };
}

document.querySelectorAll(".asset-dropdown").forEach(dropdown => {
    dropdown.addEventListener("change", () => {
        const id = dropdown.id;
        const prefixMap = {
            assetIdAnomaly: "an",
            assetIdFault: "fa",
            assetIdRul: "ru"
        };

        const prefix = prefixMap[id];
        const preset = presetValues(dropdown.value);

        if (preset) {
            fillFields(prefix, preset);
        }
    });
});

/* ---------- EXPORT JSON ---------- */
function exportJson(filename, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "text/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}

/* ---------- HISTORY ---------- */
function addHistoryRow(scanId, assetId, type, summary) {
    const table = document.querySelector("#historyTable tbody");
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${scanId}</td>
        <td>${assetId}</td>
        <td>${type}</td>
        <td>${summary}</td>
        <td>${new Date().toLocaleString()}</td>
    `;

    table.appendChild(row);
}

/* ---------- API POST ---------- */
async function post(url, payload) {
    const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    return resp.json();
}

/* ---------- ANOMALY ---------- */
document.getElementById("anomalyBtn").addEventListener("click", async () => {
    const scanId = generateScanId();
    document.getElementById("scanIdAnomaly").value = scanId;

    const payload = {
        asset_id: document.getElementById("assetIdAnomaly").value,
        scan_id: scanId,
        features: getFeatures("an")
    };

    const result = await post("/score/anomaly", payload);
    document.getElementById("anomalyResult").textContent = JSON.stringify(result, null, 2);

    addHistoryRow(scanId, payload.asset_id, "Anomaly", result.score.toFixed(4));

    document.getElementById("exportAnomaly").onclick = () =>
        exportJson(`${scanId}_PowerSenseAI_Anomaly.json`, { payload, result });
});

/* ---------- FAULT ---------- */
document.getElementById("faultBtn").addEventListener("click", async () => {
    const scanId = generateScanId();
    document.getElementById("scanIdFault").value = scanId;

    const payload = {
        asset_id: document.getElementById("assetIdFault").value,
        scan_id: scanId,
        features: getFeatures("fa")
    };

    const result = await post("/score/fault", payload);

    document.getElementById("faultResult").textContent = JSON.stringify(result, null, 2);

    const topClass = Object.entries(result.probabilities).sort((a, b) => b[1] - a[1])[0][0];

    addHistoryRow(scanId, payload.asset_id, "Fault", topClass);

    document.getElementById("exportFault").onclick = () =>
        exportJson(`${scanId}_PowerSenseAI_Fault.json`, { payload, result });
});

/* ---------- RUL ---------- */
document.getElementById("rulBtn").addEventListener("click", async () => {
    const scanId = generateScanId();
    document.getElementById("scanIdRul").value = scanId;

    const payload = {
        asset_id: document.getElementById("assetIdRul").value,
        scan_id: scanId,
        features: getFeatures("ru")
    };

    const result = await post("/score/rul", payload);

    document.getElementById("rulResult").textContent = JSON.stringify(result, null, 2);

    addHistoryRow(scanId, payload.asset_id, "RUL", result.rul_hours.toFixed(1));

    document.getElementById("exportRul").onclick = () =>
        exportJson(`${scanId}_PowerSenseAI_RUL.json`, { payload, result });
});

/* ---------- SENSOR SIMULATION ---------- */
const ctx = document.getElementById("liveChart").getContext("2d");

const liveChart = new Chart(ctx, {
    type: "line",
    data: {
        labels: [],
        datasets: [
            {
                label: "Voltage (V)",
                borderColor: "#00ffff",
                borderWidth: 2,
                tension: 0.25,
                data: [],
                yAxisID: "yVoltage",
                pointRadius: 0
            },
            {
                label: "Current (A)",
                borderColor: "#ffd166",
                borderWidth: 2,
                tension: 0.25,
                data: [],
                yAxisID: "yCurrent",
                pointRadius: 0
            },
            {
                label: "Temperature (°C)",
                borderColor: "#ff6b6b",
                borderWidth: 2,
                tension: 0.25,
                data: [],
                yAxisID: "yTemp",
                pointRadius: 0
            },
            {
                label: "Vibration",
                borderColor: "#7bd88f",
                borderWidth: 2,
                tension: 0.25,
                data: [],
                yAxisID: "yVib",
                pointRadius: 0
            }
        ]
    },
    options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: "index",
            intersect: false
        },
        plugins: {
            legend: {
                display: true
            }
        },
        scales: {
            x: {
                display: false
            },
            yVoltage: {
                type: "linear",
                position: "left",
                beginAtZero: false,
                title: {
                    display: true,
                    text: "V"
                }
            },
            yCurrent: {
                type: "linear",
                position: "right",
                beginAtZero: false,
                grid: {
                    drawOnChartArea: false
                },
                title: {
                    display: true,
                    text: "A"
                }
            },
            yTemp: {
                type: "linear",
                position: "right",
                beginAtZero: false,
                grid: {
                    drawOnChartArea: false
                },
                title: {
                    display: true,
                    text: "°C"
                }
            },
            yVib: {
                type: "linear",
                position: "left",
                beginAtZero: false,
                grid: {
                    drawOnChartArea: false
                },
                title: {
                    display: true,
                    text: "Vib"
                }
            }
        }
    }
});

let simulationInterval = null;
let simulationState = null;

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function rand(min, max) {
    return min + Math.random() * (max - min);
}

function randn(scale = 1) {
    let u = 0;
    let v = 0;

    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();

    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * scale;
}

function lowPass(prev, target, alpha) {
    return prev + alpha * (target - prev);
}

function getActiveSimulationTarget() {
    const activePanel = document.querySelector(".panel.active");
    const activeDropdown = activePanel ? activePanel.querySelector(".asset-dropdown") : null;

    const prefixMap = {
        assetIdAnomaly: "an",
        assetIdFault: "fa",
        assetIdRul: "ru"
    };

    return {
        assetId: activeDropdown?.value || document.getElementById("assetIdAnomaly").value,
        prefix: prefixMap[activeDropdown?.id] || "an"
    };
}

function getBaseReading(assetId, prefix) {
    const preset = presetValues(assetId);
    if (preset) return preset;

    const typed = getFeatures(prefix);

    return {
        voltage: Number.isFinite(typed.voltage) ? typed.voltage : 690,
        current: Number.isFinite(typed.current) ? typed.current : 120,
        temp: Number.isFinite(typed.temp) ? typed.temp : 60,
        vib: Number.isFinite(typed.vib) ? typed.vib : 0.20
    };
}

function getSimulationProfile(assetId, prefix) {
    const base = getBaseReading(assetId, prefix);

    if (assetId.startsWith("WIND_")) {
        return {
            assetId,
            base,
            type: "wind",
            baseLoad: 1.00,
            minLoad: 0.72,
            maxLoad: 1.28,
            loadSwing: 0.15,
            fastSwing: 0.05,
            loadNoise: 0.02,
            cycleSteps: 26,
            currentSensitivity: 0.90,
            voltageRegulation: 0.015,
            voltageNoisePct: 0.004,
            thermalGain: 20,
            tempNoise: 0.35,
            vibLoadGain: 0.22,
            vibTransientGain: 0.06,
            vibNoise: 0.008,
            transientProbability: 0.06,
            transientScale: 0.10,
            transientDecay: 0.82,
            degradationRate: 0.00012,
            degradationVoltageLossPct: 0.020,
            degradationTempRise: 8,
            degradationVibRise: 0.05,
            signalAlpha: 0.35,
            tempAlpha: 0.18,
            vibAlpha: 0.22
        };
    }

    if (assetId.startsWith("SOLAR_")) {
        return {
            assetId,
            base,
            type: "solar",
            baseLoad: 1.00,
            minLoad: 0.78,
            maxLoad: 1.18,
            loadSwing: 0.10,
            fastSwing: 0.08,
            loadNoise: 0.015,
            cycleSteps: 22,
            currentSensitivity: 1.00,
            voltageRegulation: 0.010,
            voltageNoisePct: 0.003,
            thermalGain: 15,
            tempNoise: 0.25,
            vibLoadGain: 0.06,
            vibTransientGain: 0.02,
            vibNoise: 0.004,
            transientProbability: 0.08,
            transientScale: 0.08,
            transientDecay: 0.78,
            degradationRate: 0.00008,
            degradationVoltageLossPct: 0.012,
            degradationTempRise: 5,
            degradationVibRise: 0.015,
            signalAlpha: 0.32,
            tempAlpha: 0.16,
            vibAlpha: 0.18
        };
    }

    if (assetId.startsWith("BATTERY_")) {
        return {
            assetId,
            base,
            type: "battery",
            baseLoad: 1.00,
            minLoad: 0.85,
            maxLoad: 1.16,
            loadSwing: 0.07,
            fastSwing: 0.04,
            loadNoise: 0.012,
            cycleSteps: 34,
            currentSensitivity: 0.75,
            voltageRegulation: 0.025,
            voltageNoisePct: 0.002,
            thermalGain: 12,
            tempNoise: 0.20,
            vibLoadGain: 0.03,
            vibTransientGain: 0.01,
            vibNoise: 0.002,
            transientProbability: 0.04,
            transientScale: 0.05,
            transientDecay: 0.84,
            degradationRate: 0.00015,
            degradationVoltageLossPct: 0.030,
            degradationTempRise: 6,
            degradationVibRise: 0.008,
            signalAlpha: 0.28,
            tempAlpha: 0.12,
            vibAlpha: 0.14
        };
    }

    return {
        assetId,
        base,
        type: "transformer",
        baseLoad: 1.00,
        minLoad: 0.88,
        maxLoad: 1.15,
        loadSwing: 0.06,
        fastSwing: 0.02,
        loadNoise: 0.010,
        cycleSteps: 40,
        currentSensitivity: 0.65,
        voltageRegulation: 0.005,
        voltageNoisePct: 0.0015,
        thermalGain: 10,
        tempNoise: 0.18,
        vibLoadGain: 0.04,
        vibTransientGain: 0.015,
        vibNoise: 0.003,
        transientProbability: 0.03,
        transientScale: 0.04,
        transientDecay: 0.86,
        degradationRate: 0.00010,
        degradationVoltageLossPct: 0.010,
        degradationTempRise: 4,
        degradationVibRise: 0.010,
        signalAlpha: 0.24,
        tempAlpha: 0.10,
        vibAlpha: 0.12
    };
}

function resetSimulationState(assetId, prefix) {
    const profile = getSimulationProfile(assetId, prefix);

    simulationState = {
        assetId,
        prefix,
        tick: 0,
        phase: rand(0, Math.PI * 2),
        health: rand(0.965, 0.995),
        transient: 0,
        ambient: rand(24, 30),
        profile,
        last: {
            voltage: profile.base.voltage,
            current: profile.base.current,
            temp: profile.base.temp,
            vib: profile.base.vib
        }
    };

    liveChart.data.labels = [];
    liveChart.data.datasets.forEach(dataset => {
        dataset.data = [];
    });
    liveChart.update();
}

function buildReading(state) {
    const p = state.profile;
    state.tick += 1;

    const slowCycle = Math.sin((2 * Math.PI * state.tick) / p.cycleSteps + state.phase);
    const fastCycle = Math.sin((2 * Math.PI * state.tick) / Math.max(6, p.cycleSteps / 4) + state.phase / 2);

    if (Math.random() < p.transientProbability) {
        state.transient += randn(p.transientScale);
    }
    state.transient *= p.transientDecay;

    state.health = clamp(state.health - p.degradationRate, 0.88, 1.00);

    state.ambient = lowPass(
        state.ambient,
        27 + 1.5 * Math.sin((2 * Math.PI * state.tick) / 120) + randn(0.2),
        0.04
    );

    const loadFactor = clamp(
        p.baseLoad +
        p.loadSwing * slowCycle +
        p.fastSwing * fastCycle +
        p.loadNoise * randn() +
        0.15 * state.transient,
        p.minLoad,
        p.maxLoad
    );

    const healthLoss = 1 - state.health;

    const currentTarget =
        p.base.current *
        (1 + p.currentSensitivity * (loadFactor - 1)) *
        (1 + 0.01 * randn());

    const voltageTarget =
        p.base.voltage *
        (
            1
            - p.voltageRegulation * (loadFactor - 1)
            - p.degradationVoltageLossPct * healthLoss
            + p.voltageNoisePct * randn()
            - 0.01 * state.transient
        );

    const tempTarget = Math.max(
        state.ambient,
        p.base.temp +
        p.thermalGain * (loadFactor - 1) +
        p.degradationTempRise * healthLoss +
        4 * Math.abs(state.transient) +
        p.tempNoise * randn()
    );

    const normalizedLoadStress = Math.abs(loadFactor - 1) / Math.max(p.loadSwing, 0.04);

    const vibTarget = Math.max(
        0.01,
        p.base.vib * (1 + p.vibLoadGain * normalizedLoadStress) +
        p.vibTransientGain * Math.abs(state.transient) +
        p.degradationVibRise * healthLoss +
        p.vibNoise * randn()
    );

    state.last.voltage = lowPass(state.last.voltage, voltageTarget, p.signalAlpha);
    state.last.current = lowPass(state.last.current, currentTarget, p.signalAlpha);
    state.last.temp = lowPass(state.last.temp, tempTarget, p.tempAlpha);
    state.last.vib = lowPass(state.last.vib, vibTarget, p.vibAlpha);

    return {
        voltage: clamp(
            Number(state.last.voltage.toFixed(p.base.voltage >= 1000 ? 0 : 2)),
            p.base.voltage * 0.85,
            p.base.voltage * 1.10
        ),
        current: clamp(
            Number(state.last.current.toFixed(2)),
            0,
            p.base.current * 1.50
        ),
        temp: clamp(
            Number(state.last.temp.toFixed(1)),
            state.ambient - 2,
            p.base.temp + 25
        ),
        vib: clamp(
            Number(state.last.vib.toFixed(3)),
            0.001,
            p.base.vib * 3
        )
    };
}

function pushReadingToInputs(prefix, reading) {
    fillFields(prefix, reading);
}

function pushReadingToChart(reading) {
    liveChart.data.labels.push("");

    liveChart.data.datasets[0].data.push(reading.voltage);
    liveChart.data.datasets[1].data.push(reading.current);
    liveChart.data.datasets[2].data.push(reading.temp);
    liveChart.data.datasets[3].data.push(reading.vib);

    const maxPoints = 60;

    if (liveChart.data.labels.length > maxPoints) {
        liveChart.data.labels.shift();
        liveChart.data.datasets.forEach(dataset => dataset.data.shift());
    }
}

function tickSimulation() {
    const target = getActiveSimulationTarget();

    if (!simulationState || simulationState.assetId !== target.assetId || simulationState.prefix !== target.prefix) {
        resetSimulationState(target.assetId, target.prefix);
    }

    const reading = buildReading(simulationState);

    pushReadingToInputs(target.prefix, reading);
    pushReadingToChart(reading);

    liveChart.update("none");
}

/* START SIM */
document.getElementById("simulateBtn").addEventListener("click", () => {
    if (simulationInterval !== null) return;

    const target = getActiveSimulationTarget();
    resetSimulationState(target.assetId, target.prefix);

    simulationInterval = setInterval(tickSimulation, 1000);
});

/* STOP SIM */
document.getElementById("stopSimBtn").addEventListener("click", () => {
    if (simulationInterval !== null) {
        clearInterval(simulationInterval);
        simulationInterval = null;
    }
});

/* RESET STATE WHEN ASSET CHANGES */
document.querySelectorAll(".asset-dropdown").forEach(dropdown => {
    dropdown.addEventListener("change", () => {
        if (simulationInterval !== null) {
            const target = getActiveSimulationTarget();
            resetSimulationState(target.assetId, target.prefix);
        }
    });
});