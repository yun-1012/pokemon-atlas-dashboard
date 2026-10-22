# Pokémon Atlas — Interactive Data Science Dashboard

**Explore Pokémon characteristics, compare battle statistics, and investigate how well machine learning models can predict primary Pokémon types.**

**[View the live dashboard](https://yun-1012.github.io/pokemon-atlas-dashboard/)** · **[Browse the source code](https://github.com/yun-1012/pokemon-atlas-dashboard)**

## Project overview

This project extends an R-based machine learning assignment into an interactive, browser-based data science portfolio. It combines exploratory data analysis (EDA), statistical visualisation, and multi-class classification to answer two questions:

1. How do numerical characteristics vary across primary Pokémon types?
2. How accurately can primary type be predicted from battle statistics and physical measurements alone?

The interface is built with **HTML, CSS and JavaScript**, while model training and evaluation are performed in **R**. The deployed site displays exported model results; it does not train models in the browser.

## Interactive dashboard

- **Pokédex overview:** Dataset size, primary-type counts and summary statistics.
- **Type distribution and explorer:** Explore 18 primary types and filter average Attack, Defense and Speed.
- **Type comparison:** Compare average battle statistics between two selected types.
- **Interactive boxplots:** Examine medians, spread, outliers and overlap across types.
- **Correlation heatmap:** Inspect Pearson correlations among battle statistics, height and weight.
- **Machine learning analysis:** Compare models, examine per-class F1 scores, inspect the confusion matrix, and explore Random Forest feature importance and class-specific Lasso coefficients.

## Data and methodology

**Dataset:** [The Complete Pokémon Dataset — Rounak Banik (Kaggle)](https://www.kaggle.com/datasets/rounakbanik/pokemon). The version used here contains **801 Pokémon and 41 columns**.

For predictive modelling:

- **Target:** Primary type (`type1`).
- **Predictors (8):** `hp`, `attack`, `defense`, `sp_attack`, `sp_defense`, `speed`, `height_m`, `weight_kg`.
- **Preprocessing:** Remove records with missing values in the selected modelling fields; exclude the extremely rare primary Flying class.
- **Modelling sample:** **778 observations**, **17 classes**.
- **Data split:** Stratified 70/30 training/test split (**550 training**, **228 test**), with `set.seed(1012)`.
- **Model selection:** 5-fold cross-validation on training data to tune regularisation parameters (`alpha`, `lambda`) and Random Forest `mtry`.
- **Evaluation:** Held-out test accuracy, macro F1, balanced accuracy (macro recall), and a confusion matrix.

Type-effectiveness fields such as `against_fire` and `against_water` are deliberately excluded from predictive features because they encode information closely tied to Pokémon type and could produce target leakage.

## Machine learning results

| Model | Test accuracy | Macro F1 | Balanced accuracy |
| --- | ---: | ---: | ---: |
| Majority-class baseline (Water) | 14.9% | 0.015 | 0.059 |
| Elastic Net family (selected **Lasso**) | 21.1% | 0.113 | 0.132 |
| **Random Forest** | **27.2%** | **0.185** | **0.195** |

**Selected hyperparameters:** Lasso `alpha = 1`, `lambda ≈ 0.00720`; Random Forest `mtry = 3` with `ntree = 500` fixed.

### Key findings

- Random Forest performed best on the held-out test set, but **27.2% accuracy and 0.185 macro F1 are still modest**: the models cannot reliably distinguish all 17 classes.
- Performance differed substantially by type. **Normal** achieved an F1 score of **0.519**, while **Fairy, Ghost, Ground, Ice and Poison** had F1 scores of **0** in this test split.
- EDA shows substantial overlap in numerical attributes across types, helping explain why classification is challenging.
- **Weight, Special Attack and Attack** ranked highest by Random Forest *Mean Decrease Gini*. This is a model-specific impurity measure, **not a causal effect or a percentage contribution**.
- Lasso retained non-zero coefficients for Special Attack in **12 of 17** class equations. Coefficients are class-specific and are not directly comparable across predictors measured on different scales.

### Limitations

- The dataset has **uneven class sizes**; the smallest types are difficult to evaluate reliably.
- The model uses a limited set of numerical predictors rather than moves, abilities, type matchups or other information that may distinguish types.
- Scores come from **one held-out split**; different splits may produce different results.
- Gini importance can be biased toward variables with many distinct values and should not be interpreted causally.
- The tuned model selected `alpha = 1` (Lasso); this result does not show that every Elastic Net configuration would perform worse on other samples.

## Tech stack

| Layer | Tools |
| --- | --- |
| Analysis and modelling | R, `caret`, `glmnet`, `randomForest` |
| Web interface | HTML, CSS, JavaScript |
| Charts and data loading | Chart.js, Plotly.js, Papa Parse |
| Hosting | GitHub Pages |

## Repository structure

```text
pokemon-atlas-dashboard/
├── assets/type-icons/          # Type icon images
├── data/pokemon.csv            # Source data
├── results/                    # Exported model metrics and interpretations
├── app.js                      # Interactive visualisations
├── index.html                  # Dashboard markup
├── styles.css                  # Dashboard styles
├── model_training.R            # Data preparation, modelling and evaluation
└── README.md
```

## Run locally

1. Download or clone this repository.
2. Open the project folder in VS Code and run `index.html` using **Live Server**, or serve the folder with a local HTTP server. Opening the HTML file directly from disk may block CSV loading.
3. To reproduce the machine learning results, install R and the required packages:

   ```r
   install.packages(c("caret", "glmnet", "randomForest"))
   ```

4. From the project root, execute:

   ```bash
   Rscript model_training.R
   ```

   The script exports analysis files to `results/`. Then refresh the local dashboard to see the updated results.

## Data attribution and disclaimer

Dataset credit: **Rounak Banik**, *The Complete Pokémon Dataset* (Kaggle), linked above. The Pokémon names, types and imagery are associated with their respective rights holders. This is an **unofficial, non-commercial educational portfolio project** and is not affiliated with or endorsed by The Pokémon Company, Nintendo or Game Freak.

**Asset licensing note:** The type icons are third-party visual assets. Their redistribution rights should be verified or the icons replaced with appropriately licensed alternatives before broader reuse. The repository does not grant rights to third-party trademarks or artwork.
