library(caret)

# 1. Load dataset
pokemon <- read.csv("data/pokemon.csv")

# 2. Select features
features <- c(
  "type1", "hp", "attack", "defense",
  "sp_attack", "sp_defense", "speed",
  "height_m", "weight_kg"
)

data <- na.omit(pokemon[, features])

# 3. Remove extremely rare class
data <- subset(data, type1 != "flying")
data$type1 <- factor(data$type1)

# 4. Stratified Train-Test Split
set.seed(1012)

index <- createDataPartition(
  data$type1,
  p = 0.7,
  list = FALSE
)

train <- data[index, ]
test <- data[-index, ]

# 5. Majority-class Baseline
majority <- names(which.max(table(train$type1)))

baseline_accuracy <- mean(test$type1 == majority)

# 6. Check results
cat("Original observations:", nrow(pokemon), "\n")
cat("Modelling observations:", nrow(data), "\n")
cat("Training observations:", nrow(train), "\n")
cat("Testing observations:", nrow(test), "\n")
cat("Number of classes:", nlevels(data$type1), "\n")
cat("Majority class:", majority, "\n")
cat("Baseline accuracy:", round(baseline_accuracy, 3), "\n")


# 7. Hyperparameter Tuning
library(glmnet)
library(randomForest)

set.seed(1012)

# Use the same CV folds for both models
folds <- createFolds(train$type1, k = 5, returnTrain = TRUE)

control <- trainControl(
  method = "cv",
  number = 5,
  index = folds
)

# 8. Elastic Net
set.seed(1012)

en_model <- caret::train(
  type1 ~ .,
  data = train,
  method = "glmnet",
  trControl = control,
  tuneGrid = expand.grid(
    alpha = c(0, 0.5, 1),
    lambda = 10^seq(-3, 0, length.out = 8)
  ),
  metric = "Accuracy"
)

# 9. Random Forest
set.seed(1012)

rf_model <- caret::train(
  type1 ~ .,
  data = train,
  method = "rf",
  trControl = control,
  tuneGrid = expand.grid(
    mtry = c(2, 3, 5, 8)
  ),
  ntree = 500,
  metric = "Accuracy"
)

# 10. Test Predictions
en_pred <- predict(en_model, test)
rf_pred <- predict(rf_model, test)

cat("\nElastic Net best parameters:\n")
print(en_model$bestTune)

cat("\nRandom Forest best parameters:\n")
print(rf_model$bestTune)

cat("\nTest Accuracy:\n")
cat("Baseline:", round(baseline_accuracy, 3), "\n")
cat("Elastic Net:", round(mean(en_pred == test$type1), 3), "\n")
cat("Random Forest:", round(mean(rf_pred == test$type1), 3), "\n")


# 11. Model Evaluation

# Keep the same 17 class labels
classes <- levels(test$type1)

# Evaluation function
evaluate_model <- function(actual, predicted) {

  cm <- table(
    Actual = factor(actual, levels = classes),
    Predicted = factor(predicted, levels = classes)
  )

  # Correct predictions for each class
  tp <- diag(cm)

  # Precision and Recall
  precision <- ifelse(
    colSums(cm) > 0,
    tp / colSums(cm),
    0
  )

  recall <- ifelse(
    rowSums(cm) > 0,
    tp / rowSums(cm),
    NA_real_
  )

  # F1 Score
  f1 <- ifelse(
    precision + recall > 0,
    2 * precision * recall / (precision + recall),
    0
  )

  # Overall metrics
  accuracy <- sum(tp) / sum(cm)
  macro_f1 <- mean(f1, na.rm = TRUE)
  balanced_accuracy <- mean(recall, na.rm = TRUE)

  # Per-class results
  per_class <- data.frame(
    Type = classes,
    Support = as.vector(rowSums(cm)),
    Precision = round(precision, 3),
    Recall = round(recall, 3),
    F1 = round(f1, 3)
  )

  return(list(
    accuracy = accuracy,
    macro_f1 = macro_f1,
    balanced_accuracy = balanced_accuracy,
    confusion_matrix = cm,
    per_class = per_class
  ))
}


# 12. Evaluate All Models

baseline_pred <- rep(majority, nrow(test))

baseline_eval <- evaluate_model(test$type1, baseline_pred)
en_eval <- evaluate_model(test$type1, en_pred)
rf_eval <- evaluate_model(test$type1, rf_pred)


# 13. Model Comparison Table

model_metrics <- data.frame(
  Model = c("Baseline", "Elastic Net", "Random Forest"),

  Accuracy = c(
    baseline_eval$accuracy,
    en_eval$accuracy,
    rf_eval$accuracy
  ),

  Macro_F1 = c(
    baseline_eval$macro_f1,
    en_eval$macro_f1,
    rf_eval$macro_f1
  ),

  Balanced_Accuracy = c(
    baseline_eval$balanced_accuracy,
    en_eval$balanced_accuracy,
    rf_eval$balanced_accuracy
  )
)

model_metrics[, -1] <- round(model_metrics[, -1], 3)

cat("\n=== Model Comparison ===\n")
print(model_metrics, row.names = FALSE)


# 14. Random Forest Per-Class Performance

cat("\n=== Random Forest Per-Class Results ===\n")
print(rf_eval$per_class, row.names = FALSE)


# 15. Random Forest Confusion Matrix

cat("\n=== Random Forest Confusion Matrix ===\n")
print(rf_eval$confusion_matrix)


# 16. Save Results for Dashboard

dir.create("results", showWarnings = FALSE)

write.csv(
  model_metrics,
  "results/model_metrics.csv",
  row.names = FALSE
)

write.csv(
  rf_eval$per_class,
  "results/per_class_metrics.csv",
  row.names = FALSE
)

write.csv(
  as.data.frame.matrix(rf_eval$confusion_matrix),
  "results/confusion_matrix_rf.csv",
  row.names = TRUE
)

cat("\nEvaluation results saved successfully!\n")



# =====================
# Model Interpretation
# =====================

# 1. Random Forest Feature Importance
rf_imp <- randomForest::importance(
  rf_model$finalModel,
  type = 2
)

rf_importance <- data.frame(
  Feature = rownames(rf_imp),
  Importance = as.numeric(rf_imp[, "MeanDecreaseGini"])
)

rf_importance <- rf_importance[
  order(-rf_importance$Importance),
]

cat("\n=== Random Forest Feature Importance ===\n")
print(rf_importance, row.names = FALSE)


# 2. Lasso Coefficients for Each Class
lasso_coef <- coef(
  en_model$finalModel,
  s = en_model$bestTune$lambda
)

lasso_results <- do.call(rbind, lapply(
  names(lasso_coef),
  function(type) {

    m <- as.matrix(lasso_coef[[type]])

    data.frame(
      Type = type,
      Feature = rownames(m),
      Coefficient = as.numeric(m[, 1])
    )
  }
))

# Exclude intercept
lasso_results <- subset(
  lasso_results,
  Feature != "(Intercept)"
)

# Identify non-zero coefficients
lasso_results$Selected <- abs(
  lasso_results$Coefficient
) > 1e-8


# 3. Variable Selection Summary
selection_summary <- aggregate(
  Selected ~ Feature,
  data = lasso_results,
  FUN = sum
)

names(selection_summary)[2] <- "Nonzero_Class_Count"

selection_summary <- selection_summary[
  order(-selection_summary$Nonzero_Class_Count),
]

cat("\n=== Lasso Variable Selection ===\n")
print(selection_summary, row.names = FALSE)


# 4. Save Results
dir.create("results", showWarnings = FALSE)

write.csv(
  rf_importance,
  "results/rf_feature_importance.csv",
  row.names = FALSE
)

write.csv(
  lasso_results,
  "results/lasso_coefficients.csv",
  row.names = FALSE
)

write.csv(
  selection_summary,
  "results/lasso_selection_summary.csv",
  row.names = FALSE
)

cat("\nStep 10 results saved successfully!\n")
