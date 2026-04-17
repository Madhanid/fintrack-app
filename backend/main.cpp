#include "crow.h"
#include "database.hpp"
#include "analytics.hpp"
#include <iostream>
#include <vector>
#include <algorithm>
#include <map>

int main() {
    crow::SimpleApp app;
    Database db("db/fintrack.db");

    // Seed dummy data if empty
    if (db.getAllTransactions().empty()) {
        db.addTransaction("Salary", 50000.0, "2023-10-01", "Income");
        db.addTransaction("Groceries", -3000.0, "2023-10-05", "Food");
        db.addTransaction("Electricity", -1500.0, "2023-10-07", "Bills");
        db.addTransaction("Internet", -1000.0, "2023-10-08", "Bills");
        db.addTransaction("Dining", -2500.0, "2023-10-12", "Food");
        db.addTransaction("Movie", -800.0, "2023-10-15", "Entertainment");
        db.addBudget("Food", 8000.0, 5500.0);
        db.addBudget("Bills", 4000.0, 2500.0);
        db.addBudget("Entertainment", 3000.0, 800.0);
    }

    // Middleware for CORS
    auto cors_response = [](crow::response& res) {
        res.add_header("Access-Control-Allow-Origin", "*");
        res.add_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.add_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    };

    CROW_ROUTE(app, "/api/status")
    ([&](crow::response& res) {
        res.write("Backend is active");
        cors_response(res);
        res.end();
    });

    CROW_ROUTE(app, "/api/auth/login").methods("POST"_method)
    ([&](const crow::request& req, crow::response& res) {
        auto x = crow::json::load(req.body);
        if (!x || !x.has("username") || !x.has("password")) {
            res.code = 400;
            res.end();
            return;
        }
        // Simplified auth for now
        crow::json::wvalue root;
        root["token"] = "mock_token_123";
        root["user"]["username"] = x["username"].s();
        res.write(root.dump());
        cors_response(res);
        res.end();
    });

    CROW_ROUTE(app, "/api/transactions").methods("GET"_method)
    ([&](crow::response& res) {
        auto txs = db.getAllTransactions();
        crow::json::wvalue x = crow::json::wvalue::list();
        for (size_t i = 0; i < txs.size(); i++) {
            x[i]["id"] = txs[i].id;
            x[i]["description"] = txs[i].description;
            x[i]["amount"] = txs[i].amount;
            x[i]["date"] = txs[i].date;
            x[i]["category"] = txs[i].category;
        }
        res.write(x.dump());
        cors_response(res);
        res.end();
    });

    CROW_ROUTE(app, "/api/summary")
    ([&](crow::response& res) {
        auto txs = db.getAllTransactions();
        auto budgets = db.getAllBudgets();
        
        double totalBalance = 0;
        double totalIncome = 0;
        double totalExpenses = 0;
        double monthlyBudget = 0;
        
        for (const auto& b : budgets) monthlyBudget += b.target;
        
        for (const auto& t : txs) {
            totalBalance += t.amount;
            if (t.amount > 0) totalIncome += t.amount;
            else totalExpenses += std::abs(t.amount);
        }
        
        crow::json::wvalue summary;
        summary["totalBalance"] = totalBalance;
        summary["totalIncome"] = totalIncome;
        summary["totalExpenses"] = totalExpenses;
        summary["monthlyBudget"] = monthlyBudget;
        
        res.write(summary.dump());
        cors_response(res);
        res.end();
    });

    CROW_ROUTE(app, "/api/transactions").methods("POST"_method)
    ([&](const crow::request& req, crow::response& res) {
        auto x = crow::json::load(req.body);
        if (!x || !x.has("description") || !x.has("amount")) {
            res.code = 400;
            res.end();
            return;
        }
        
        bool success = db.addTransaction(
            x["description"].s(),
            x["amount"].d(),
            x.has("date") ? x["date"].s() : std::string("2023-01-01"),
            x.has("category") ? x["category"].s() : std::string("General")
        );

        res.code = success ? 201 : 500;
        cors_response(res);
        res.end();
    });

    CROW_ROUTE(app, "/api/transactions/<int>").methods("PUT"_method)
    ([&](const crow::request& req, crow::response& res, int id) {
        auto x = crow::json::load(req.body);
        if (!x) {
            res.code = 400;
            res.end();
            return;
        }

        bool success = db.updateTransaction(
            id,
            x["description"].s(),
            x["amount"].d(),
            x["date"].s(),
            x["category"].s()
        );

        res.code = success ? 200 : 500;
        cors_response(res);
        res.end();
    });

    CROW_ROUTE(app, "/api/transactions/<int>").methods("DELETE"_method)
    ([&](crow::response& res, int id) {
        bool success = db.deleteTransaction(id);
        res.code = success ? 200 : 500;
        cors_response(res);
        res.end();
    });

    CROW_ROUTE(app, "/api/predict")
    ([&](crow::response& res) {
        auto txs = db.getAllTransactions();
        std::vector<double> history;
        for (const auto& t : txs) history.push_back(t.amount);
        
        double prediction = Analytics::predictNextMonthSpending(history);
        crow::json::wvalue root;
        root["predicted_spending"] = prediction;
        res.write(root.dump());
        cors_response(res);
        res.end();
    });

    CROW_ROUTE(app, "/api/budgets").methods("GET"_method)
    ([&](crow::response& res) {
        auto budgets = db.getAllBudgets();
        crow::json::wvalue x = crow::json::wvalue::list();
        for (size_t i = 0; i < budgets.size(); i++) {
            x[i]["id"] = budgets[i].id;
            x[i]["category"] = budgets[i].category;
            x[i]["target"] = budgets[i].target;
            x[i]["current"] = budgets[i].current;
        }
        res.write(x.dump());
        cors_response(res);
        res.end();
    });

    CROW_ROUTE(app, "/api/budgets").methods("POST"_method)
    ([&](const crow::request& req, crow::response& res) {
        auto x = crow::json::load(req.body);
        if (!x || !x.has("category") || !x.has("target")) {
            res.code = 400;
            res.end();
            return;
        }
        bool success = db.addBudget(x["category"].s(), x["target"].d(), x.has("current") ? x["current"].d() : 0.0);
        res.code = success ? 201 : 500;
        cors_response(res);
        res.end();
    });

    // AI Chat History Endpoint
    CROW_ROUTE(app, "/api/ai/chat").methods("GET"_method)
    ([&](crow::response& res) {
        auto history = db.getChatHistory();
        crow::json::wvalue x = crow::json::wvalue::list();
        for (size_t i = 0; i < history.size(); i++) {
            x[i]["role"] = history[i].role;
            x[i]["content"] = history[i].content;
            x[i]["timestamp"] = history[i].timestamp;
        }
        res.write(x.dump());
        cors_response(res);
        res.end();
    });

    // AI Chat Interation Endpoint
    CROW_ROUTE(app, "/api/ai/chat").methods("POST"_method)
    ([&](const crow::request& req, crow::response& res) {
        auto x = crow::json::load(req.body);
        if (!x || !x.has("message")) {
            res.code = 400;
            res.end();
            return;
        }

        std::string userMsg = x["message"].s();
        db.addChatMessage("user", userMsg);

        // Analyze transactions for recommendations
        auto txs = db.getAllTransactions();
        auto budgets = db.getAllBudgets();
        
        std::map<std::string, double> categorySpending;
        double totalSpend = 0;
        for (const auto& t : txs) {
            if (t.amount < 0) {
                categorySpending[t.category] += std::abs(t.amount);
                totalSpend += std::abs(t.amount);
            }
        }

        std::string lowerMsg = userMsg;
        std::transform(lowerMsg.begin(), lowerMsg.end(), lowerMsg.begin(), ::tolower);

        std::string aiResponse;
        if (lowerMsg.find("analyze") != std::string::npos || lowerMsg.find("spend") != std::string::npos || lowerMsg.find("help") != std::string::npos) {
            aiResponse = "I've analyzed your spending. ";
            if (categorySpending.empty()) {
                aiResponse += "You haven't recorded any expenses yet! Start adding some to get insights.";
            } else {
                auto topCat = std::max_element(categorySpending.begin(), categorySpending.end(),
                    [](const auto& a, const auto& b) { return a.second < b.second; });
                
                aiResponse += "Your highest spending is in **" + topCat->first + "** (₹" + std::to_string((int)topCat->second) + "). ";
                aiResponse += "To reduce costs, try to limit non-essential purchases in this category. ";
                
                if (totalSpend > 5000) {
                    aiResponse += "Also, your total monthly spending is quite high. I recommend setting a stricter budget for Entertainment.";
                }
            }
        } else if (lowerMsg.find("hello") != std::string::npos || lowerMsg.find("hi") != std::string::npos) {
            aiResponse = "Hello! I am your FinTrack AI assistant. How can I assist you with your finances today?";
        } else if (lowerMsg.find("balance") != std::string::npos) {
            aiResponse = "Your total balance is determined by your total income minus your expenses. You can check the Dashboard for real-time overview.";
        } else if (lowerMsg.find("budget") != std::string::npos) {
            aiResponse = "Setting budgets is a great way to save money! You have active budgets in your dashboard. Would you like tips on how to stick to them?";
        } else if (lowerMsg.find("save") != std::string::npos || lowerMsg.find("saving") != std::string::npos) {
            aiResponse = "To save more money, start by identifying non-essential expenses in categories like Entertainment. Also, consider setting up a recurring transfer to a savings account.";
        } else {
            aiResponse = "That's an interesting question! Based on your financial data, I recommend watching your expense trends. I am always learning to answer more of your questions.";
        }

        db.addChatMessage("ai", aiResponse);

        crow::json::wvalue root;
        root["response"] = aiResponse;
        res.write(root.dump());
        cors_response(res);
        res.end();
    });

    std::cout << "FinTrack C++ Backend running on port 8080..." << std::endl;
    app.port(8080).multithreaded().run();
}
