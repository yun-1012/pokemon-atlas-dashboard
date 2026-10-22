// Pokémon Atlas: the dataset is loaded once for all EDA visualizations.
const TYPE_COLORS = {
    bug: "#8fac65", dark: "#81748f", dragon: "#766cbe",
    electric: "#d9ab45", fairy: "#d48db1", fighting: "#c47a69",
    fire: "#e98563", flying: "#8daabf", ghost: "#8677aa",
    grass: "#73ae83", ground: "#bb9c76", ice: "#75bbc7",
    normal: "#9aa1ab", poison: "#a27cb7", psychic: "#dc8294",
    rock: "#ab9c83", steel: "#8497a7", water: "#6d9dd6"
};
const typeColor = type => TYPE_COLORS[String(type).toLowerCase()] || "#8b97a8";
const displayType = type => String(type).replace(/^./, c => c.toUpperCase());

Chart.defaults.font.family = 'Inter, system-ui, Segoe UI, Arial, sans-serif';
Chart.defaults.color = "#728096";
Chart.defaults.plugins.legend.labels.usePointStyle = true;

Papa.parse("data/pokemon.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,

    complete: function(results) {

        // 1. Load Pokemon Data
        const pokemon = results.data.filter(row => row.type1);

        const types = [...new Set(
            pokemon.map(row => row.type1.trim())
        )];

        document.getElementById("totalPokemon").textContent = pokemon.length;
        document.getElementById("totalTypes").textContent = types.length;


        // 2. Pokemon Type Distribution
        const counts = {};

        pokemon.forEach(row => {
            const type = row.type1.trim();
            counts[type] = (counts[type] || 0) + 1;
        });

        const sortedTypes = Object.entries(counts)
            .sort((a, b) => b[1] - a[1]);

        new Chart(document.getElementById("typeChart"), {
            type: "bar",
            data: {
                labels: sortedTypes.map(item => displayType(item[0])),
                datasets: [{
                    label: "Pokémon",
                    data: sortedTypes.map(item => item[1]),
                    backgroundColor: sortedTypes.map(item => typeColor(item[0])),
                    borderRadius: 5,
                    barPercentage: 0.75
                }]
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { displayColors: false }
                },
                scales: {
                    x: { beginAtZero: true, grid: { color: "#edf0f5" }, border: { display: false } },
                    y: { grid: { display: false }, border: { display: false } }
                }
            }
        });


        // 3. Average Statistics Function
        function average(data, feature) {
            const values = data
                .map(row => row[feature])
                .filter(value => value != null && String(value).trim() !== "")
                .map(Number)
                .filter(Number.isFinite);

            if (values.length === 0) return null;

            return values.reduce((a, b) => a + b, 0) / values.length;
        }


        // 4. Pokemon Type Explorer
        const typeSelect = document.getElementById("typeSelect");

        sortedTypes.forEach(item => {
            const option = document.createElement("option");
            option.value = item[0];
            option.textContent = item[0];
            typeSelect.appendChild(option);
        });

        function updateStats() {
            const selected = typeSelect.value;

            const filtered = selected === "all"
                ? pokemon
                : pokemon.filter(row => row.type1.trim() === selected);

            document.getElementById("selectedCount").textContent =
                filtered.length;

            const badge = document.getElementById("selectedTypeBadge");
            badge.className = "type-pill type-pill-with-icon";
            badge.replaceChildren();
            if (selected !== "all") {
                const icon = document.createElement("img");
                icon.src = `assets/type-icons/${selected}.png`;
                icon.alt = "";
                icon.className = "type-pill-icon";
                badge.appendChild(icon);
            }
            badge.appendChild(document.createTextNode(selected === "all" ? "ALL TYPES" : displayType(selected).toUpperCase()));
            badge.style.backgroundColor = selected === "all" ? "#eef1f6" : typeColor(selected) + "24";
            badge.style.color = selected === "all" ? "#66758b" : typeColor(selected);

            const stats = {
                avgAttack: "attack",
                avgDefense: "defense",
                avgSpeed: "speed"
            };

            Object.entries(stats).forEach(([id, feature]) => {
                const value = average(filtered, feature);

                document.getElementById(id).textContent =
                    value === null ? "N/A" : value.toFixed(1);
            });
        }

        typeSelect.addEventListener("change", updateStats);
        updateStats();

        // Clicking a type icon in the header opens the matching Explorer view.
        document.querySelectorAll(".type-icon-btn").forEach(button => {
            button.addEventListener("click", () => {
                typeSelect.value = button.dataset.type;
                typeSelect.dispatchEvent(new Event("change"));
                document.getElementById("type-explorer-title").scrollIntoView({
                    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
                    block: "center"
                });
            });
        });


        // 5. Battle Statistics Comparison
        const compareType1 = document.getElementById("compareType1");
        const compareType2 = document.getElementById("compareType2");

        [compareType1, compareType2].forEach(select => {
            sortedTypes.forEach(item => {
                const option = document.createElement("option");
                option.value = item[0];
                option.textContent = item[0];
                select.appendChild(option);
            });
        });

        compareType1.value = "water";
        compareType2.value = "fire";

        const features = ["attack", "defense", "speed"];

        const comparisonChart = new Chart(
            document.getElementById("comparisonChart"), {
                type: "bar",
                data: {
                    labels: ["Attack", "Defense", "Speed"],
                    datasets: [
                        {
                            label: "Water",
                            data: [],
                            backgroundColor: "#4A90E2"
                        },
                        {
                            label: "Fire",
                            data: [],
                            backgroundColor: "#D64545"
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, grid: { color: "#edf0f5" }, border: { display: false } },
                        x: { grid: { display: false }, border: { display: false } }
                    }
                }
            }
        );

        function updateComparison() {
            const type1 = compareType1.value;
            const type2 = compareType2.value;

            const data1 = pokemon.filter(row => row.type1.trim() === type1);
            const data2 = pokemon.filter(row => row.type1.trim() === type2);

            comparisonChart.data.datasets[0].label = displayType(type1);
            comparisonChart.data.datasets[1].label = displayType(type2);
            comparisonChart.data.datasets[0].backgroundColor = typeColor(type1);
            comparisonChart.data.datasets[1].backgroundColor = typeColor(type2);

            comparisonChart.data.datasets[0].data =
                features.map(f => average(data1, f));

            comparisonChart.data.datasets[1].data =
                features.map(f => average(data2, f));

            comparisonChart.update();
        }

        compareType1.addEventListener("change", updateComparison);
        compareType2.addEventListener("change", updateComparison);
        updateComparison();


        // 6. Interactive Boxplot
        const statSelect = document.getElementById("statSelect");

        function updateBoxplot() {
            const feature = statSelect.value;

            const traces = [...types].sort().map(type => {
                const values = pokemon
                    .filter(row => row.type1.trim() === type)
                    .map(row => row[feature])
                    .filter(value => value != null && String(value).trim() !== "")
                    .map(Number)
                    .filter(Number.isFinite);

                return {
                    x: values,
                    name: type,
                    type: "box",
                    orientation: "h",
                    boxpoints: "outliers",
                    marker: { color: typeColor(type) },
                    line: { color: typeColor(type), width: 1.5 },
                    fillcolor: typeColor(type) + "35",
                    showlegend: false
                };
            });

            Plotly.react("boxplotChart", traces, {
                height: 690,
                margin: { l: 105, r: 25, t: 25, b: 65 },
                xaxis: {
                    title: { text: "Battle stat value", font: { size: 12, color: "#7c8a9d" } },
                    zeroline: false, gridcolor: "#ecf0f5"
                },
                yaxis: { automargin: true, tickfont: { color: "#617187" } },
                paper_bgcolor: "white",
                plot_bgcolor: "white",
                font: { family: "Inter, Arial", color: "#687890" }
            }, {
                responsive: true,
                displaylogo: false
            });
        }

        statSelect.addEventListener("change", updateBoxplot);
        updateBoxplot();


        // 7. Pearson Correlation Heatmap
        const corrFeatures = [
            "hp", "attack", "defense",
            "sp_attack", "sp_defense", "speed",
            "height_m", "weight_kg"
        ];

        const corrLabels = [
            "HP", "Attack", "Defense",
            "Sp. Attack", "Sp. Defense", "Speed",
            "Height", "Weight"
        ];

        // Keep only complete numerical observations
        const completeData = pokemon.filter(row =>
            corrFeatures.every(feature => {
                const value = row[feature];

                return value != null &&
                    String(value).trim() !== "" &&
                    Number.isFinite(Number(value));
            })
        );

        document.getElementById("corrSample").textContent =
            completeData.length;

        // Pearson correlation function
        function pearson(x, y) {
            const n = x.length;

            const meanX = x.reduce((a, b) => a + b, 0) / n;
            const meanY = y.reduce((a, b) => a + b, 0) / n;

            let numerator = 0;
            let sumX = 0;
            let sumY = 0;

            for (let i = 0; i < n; i++) {
                const dx = x[i] - meanX;
                const dy = y[i] - meanY;

                numerator += dx * dy;
                sumX += dx * dx;
                sumY += dy * dy;
            }

            const denominator = Math.sqrt(sumX * sumY);

            return denominator === 0 ? null : numerator / denominator;
        }

        // Calculate correlation matrix
        const columns = corrFeatures.map(feature =>
            completeData.map(row => Number(row[feature]))
        );

        const correlationMatrix = columns.map(x =>
            columns.map(y => pearson(x, y))
        );

        // Draw heatmap
        Plotly.newPlot("correlationChart", [{
            z: correlationMatrix,
            x: corrLabels,
            y: corrLabels,
            type: "heatmap",
            colorscale: [
                [0, "#c47b8b"],
                [0.5, "#f1f3f8"],
                [1, "#6a92c7"]
            ],
            zmin: -1,
            zmax: 1,
            zmid: 0,
            xgap: 2,
            ygap: 2,
            text: correlationMatrix.map(row =>
                row.map(value =>
                    value === null ? "N/A" : value.toFixed(2)
                )
            ),
            texttemplate: "%{text}",
            textfont: { size: 11, color: "#253247" },
            hovertemplate:
                "%{y} vs %{x}<br>Pearson r: %{z:.3f}<extra></extra>",
            colorbar: { title: "Pearson r" }
        }], {
            height: 570,
            margin: { l: 110, r: 45, t: 25, b: 105 },
            xaxis: { automargin: true, tickfont: { color: "#65758b" } },
            yaxis: { automargin: true, autorange: "reversed", tickfont: { color: "#65758b" } },
            paper_bgcolor: "white",
            font: { family: "Inter, Arial", color: "#617187" }
        }, {
            responsive: true,
            displaylogo: false
        });

    },

    error: function(error) {
        console.error("Failed to load Pokémon CSV:", error);
    }
});


// ===========================
// Machine Learning Dashboard
// ===========================

// 1. Read model results from CSV
function loadCSV(path) {
    return new Promise((resolve, reject) => {
        Papa.parse(path, {
            download: true,
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: function(results) {
                if (results.errors.length > 0) {
                    reject(results.errors);
                } else {
                    resolve(results.data);
                }
            },
            error: reject
        });
    });
}


// 2. Load both result files
Promise.all([
    loadCSV("results/model_metrics.csv"),
    loadCSV("results/per_class_metrics.csv")
]).then(([metrics, perClass]) => {

    // 3. Model Performance Chart
    new Chart(document.getElementById("modelMetricsChart"), {
        type: "bar",
        data: {
            labels: metrics.map(row => row.Model),
            datasets: [
                {
                    label: "Accuracy",
                    data: metrics.map(row => row.Accuracy * 100),
                    backgroundColor: "#618dc3",
                    borderRadius: 6
                },
                {
                    label: "Macro F1",
                    data: metrics.map(row => row.Macro_F1 * 100),
                    backgroundColor: "#79b5a7",
                    borderRadius: 6
                },
                {
                    label: "Balanced Accuracy",
                    data: metrics.map(row => row.Balanced_Accuracy * 100),
                    backgroundColor: "#e2a078",
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: 35,
                    max: Math.min(100, Math.ceil((Math.max(...metrics.flatMap(row =>
                        [row.Accuracy, row.Macro_F1, row.Balanced_Accuracy])) * 100 + 5) / 5) * 5),
                    grid: { color: "#edf0f5" },
                    border: { display: false },
                    title: { display: true, text: "Score (%)" }
                },
                x: { grid: { display: false }, border: { display: false } }
            }
        }
    });


    // 4. Per-Class F1 Chart
    const sortedClasses = [...perClass]
        .sort((a, b) => b.F1 - a.F1);

    new Chart(document.getElementById("perClassChart"), {
        type: "bar",
        data: {
            labels: sortedClasses.map(row => row.Type),
            datasets: [{
                label: "F1 Score",
                data: sortedClasses.map(row => row.F1),
                backgroundColor: sortedClasses.map(row =>
                    row.F1 === 0 ? "#d9e0e9" : typeColor(row.Type)),
                borderRadius: 5,
                barPercentage: 0.76
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        afterLabel: function(context) {
                            return "Test samples: " +
                                sortedClasses[context.dataIndex].Support;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: Math.min(1, Math.ceil((Math.max(...sortedClasses.map(row => row.F1)) + 0.05) * 10) / 10),
                    grid: { color: "#edf0f5" },
                    border: { display: false },
                    title: { display: true, text: "F1 Score" }
                },
                y: { grid: { display: false }, border: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });

}).catch(error => {
    console.error("Failed to load ML results:", error);
});


// ==================
// Confusion Matrix
// ==================

Papa.parse("results/confusion_matrix_rf.csv", {
    download: true,
    header: false,
    skipEmptyLines: true,

    complete: function(results) {

        const rows = results.data;

        // Column names = Predicted Types
        const predictedTypes = rows[0].slice(1);

        // Row names = Actual Types
        const actualTypes = rows.slice(1).map(row => row[0]);

        // Convert values to numbers
        const matrix = rows.slice(1).map(row =>
            row.slice(1).map(Number)
        );

        // Draw interactive heatmap
        Plotly.newPlot("confusionMatrixChart", [{
            z: matrix,
            x: predictedTypes,
            y: actualTypes,
            type: "heatmap",

            colorscale: [
                [0, "#f2f5f9"],
                [0.25, "#bfcee2"],
                [0.55, "#7fa5d0"],
                [1, "#3c6b9d"]
            ],

            xgap: 2,
            ygap: 2,

            hovertemplate:
                "Actual: %{y}<br>" +
                "Predicted: %{x}<br>" +
                "Count: %{z}<extra></extra>",

            colorbar: {
                title: "Count"
            }

        }], {
            height: 690,

            margin: { l: 115, r: 65, t: 20, b: 120 },

            xaxis: {
                title: "Predicted Type",
                tickangle: -45
            },

            yaxis: {
                title: "Actual Type",
                autorange: "reversed"
            },

            paper_bgcolor: "white",
            font: { family: "Inter, Arial", color: "#617187" }

        }, {
            responsive: true,
            displaylogo: false
        });
    },

    error: function(error) {
        console.error("Failed to load confusion matrix:", error);
    }
});


// =====================
// Model Interpretation
// =====================

// Load CSV results
function loadInterpretationCSV(path) {
    return new Promise((resolve, reject) => {
        Papa.parse(path, {
            download: true,
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,

            complete: function(results) {
                if (results.errors.length > 0) {
                    reject(results.errors);
                } else {
                    resolve(results.data);
                }
            },

            error: reject
        });
    });
}

// Load model interpretation results
Promise.all([
    loadInterpretationCSV("results/rf_feature_importance.csv"),
    loadInterpretationCSV("results/lasso_coefficients.csv")
]).then(([importance, coefficients]) => {

    // 1. Random Forest Feature Importance
    const sortedImportance = [...importance]
        .sort((a, b) => b.Importance - a.Importance);

    new Chart(document.getElementById("importanceChart"), {
        type: "bar",

        data: {
            labels: sortedImportance.map(row => row.Feature),

            datasets: [{
                label: "Mean Decrease Gini",
                data: sortedImportance.map(row => row.Importance),
                backgroundColor: sortedImportance.map((row, i) =>
                    i === 0 ? "#e9535b" : "#7399c4"),
                borderRadius: 6,
                barPercentage: 0.72
            }]
        },

        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,

            scales: {
                x: { beginAtZero: true, grid: { color: "#edf0f5" }, border: { display: false } },
                y: { grid: { display: false }, border: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // 2. Lasso Coefficients
    const lassoSelect = document.getElementById("lassoTypeSelect");

    const types = [...new Set(
        coefficients.map(row => row.Type)
    )].sort();

    types.forEach(type => {
        const option = document.createElement("option");
        option.value = type;
        option.textContent = type;
        lassoSelect.appendChild(option);
    });

    // Set default type
    lassoSelect.value = types.includes("normal")
        ? "normal"
        : types[0];

    const lassoChart = new Chart(
        document.getElementById("lassoChart"), {

        type: "bar",

        data: {
            labels: [],
            datasets: [{
                label: "Coefficient",
                data: [],
                backgroundColor: []
            }]
        },

        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,

            scales: {
                x: {
                    grid: { color: "#edf0f5" },
                    title: { display: true, text: "Coefficient Value" }
                },
                y: { grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });

    // Update coefficients when type changes
    function updateLasso() {

        const selected = lassoSelect.value;

        const filtered = coefficients
            .filter(row => row.Type === selected);

        lassoChart.data.labels =
            filtered.map(row => row.Feature);

        lassoChart.data.datasets[0].data =
            filtered.map(row => row.Coefficient);

        lassoChart.data.datasets[0].backgroundColor =
            filtered.map(row =>
                row.Coefficient >= 0
                    ? "#6d9dcb"
                    : "#e79891"
            );

        lassoChart.update();
    }

    lassoSelect.addEventListener("change", updateLasso);

    updateLasso();

}).catch(error => {
    console.error("Failed to load interpretation results:", error);
});