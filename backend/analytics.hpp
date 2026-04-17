#pragma once
#include <vector>
#include <numeric>

class Analytics {
public:
    // Simple Linear Regression to predict next month's spending
    static double predictNextMonthSpending(const std::vector<double>& history) {
        if (history.size() < 2) return history.empty() ? 0.0 : history[0];

        int n = history.size();
        std::vector<double> x(n);
        std::iota(x.begin(), x.end(), 1); // 1, 2, 3...

        double sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (int i = 0; i < n; ++i) {
            sumX += x[i];
            sumY += history[i];
            sumXY += x[i] * history[i];
            sumX2 += x[i] * x[i];
        }

        double denominator = (n * sumX2 - sumX * sumX);
        if (denominator == 0) return history.back();

        double slope = (n * sumXY - sumX * sumY) / denominator;
        double intercept = (sumY - slope * sumX) / n;

        // Predict for n + 1
        return slope * (n + 1) + intercept;
    }
};
