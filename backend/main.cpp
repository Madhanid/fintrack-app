#include "crow.h"
#include "database.hpp"
#include "analytics.hpp"
#include <iostream>
#include <vector>
#include <algorithm>
#include <map>
#include <set>
#include <mutex>
#include <sstream>

// ── WebSocket connection registry ─────────────────────────────────────────────
std::set<crow::websocket::connection*> ws_clients;
std::mutex ws_mutex;

void ws_broadcast(const std::string& msg) {
    std::lock_guard<std::mutex> lock(ws_mutex);
    for (auto* conn : ws_clients) {
        try { conn->send_text(msg); } catch (...) {}
    }
}

// Build a JSON event string
std::string make_event(const std::string& type, const std::string& payload = "{}") {
    return "{\"type\":\"" + type + "\",\"payload\":" + payload + "}";
}

// Build a budget-alert payload
std::string make_budget_alerts(const std::vector<Budget>& budgets) {
    std::string arr = "[";
    bool first = true;
    for (const auto& b : budgets) {
        double pct = (b.target > 0) ? (b.current / b.target) * 100.0 : 0;
        if (pct >= 80) {
            if (!first) arr += ",";
            first = false;
            arr += "{\"category\":\"" + b.category +
                   "\",\"percent\":" + std::to_string((int)pct) +
                   ",\"target\":" + std::to_string(b.target) +
                   ",\"current\":" + std::to_string(b.current) + "}";
        }
    }
    arr += "]";
    return arr;
}

int main() {
    crow::SimpleApp app;
    Database db("db/fintrack.db");

    // Seed dummy data if empty
    if (db.getAllTransactions().empty()) {
        db.addTransaction("Salary",      50000.0, "2023-10-01", "Income");
        db.addTransaction("Groceries",   -3000.0, "2023-10-05", "Food");
        db.addTransaction("Electricity", -1500.0, "2023-10-07", "Bills");
        db.addTransaction("Internet",    -1000.0, "2023-10-08", "Bills");
        db.addTransaction("Dining",      -2500.0, "2023-10-12", "Food");
        db.addTransaction("Movie",        -800.0, "2023-10-15", "Entertainment");
        db.addBudget("Food",          8000.0, 5500.0);
        db.addBudget("Bills",         4000.0, 2500.0);
        db.addBudget("Entertainment", 3000.0,  800.0);
    }

    // ── CORS helper ───────────────────────────────────────────────────────────
    auto cors_response = [](crow::response& res) {
        res.add_header("Access-Control-Allow-Origin",  "*");
        res.add_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.add_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    };

    // ── WebSocket endpoint ────────────────────────────────────────────────────
    CROW_WEBSOCKET_ROUTE(app, "/ws")
        .onopen([&](crow::websocket::connection& conn) {
            std::lock_guard<std::mutex> lock(ws_mutex);
            ws_clients.insert(&conn);
            std::cout << "WS client connected. Total: " << ws_clients.size() << std::endl;
        })
        .onclose([&](crow::websocket::connection& conn, const std::string&, uint16_t) {
            std::lock_guard<std::mutex> lock(ws_mutex);
            ws_clients.erase(&conn);
            std::cout << "WS client disconnected. Total: " << ws_clients.size() << std::endl;
        })
        .onmessage([&](crow::websocket::connection& /*conn*/, const std::string& data, bool /*is_binary*/) {
            // Clients can send a "ping" to get a pong back
            if (data == "ping") {
                // no-op – handled by keep-alive on client
            }
        });

    // ── Status ────────────────────────────────────────────────────────────────
    CROW_ROUTE(app, "/api/status")
    ([&](crow::response& res) {
        res.write("Backend is active");
        cors_response(res);
        res.end();
    });

    // OPTIONS pre-flight
    CROW_ROUTE(app, "/api/<path>").methods("OPTIONS"_method)
    ([&](crow::response& res, const std::string&) {
        cors_response(res);
        res.code = 204;
        res.end();
    });

    // ── Auth ──────────────────────────────────────────────────────────────────
    CROW_ROUTE(app, "/api/auth/login").methods("POST"_method)
    ([&](const crow::request& req, crow::response& res) {
        auto x = crow::json::load(req.body);
        if (!x || !x.has("username") || !x.has("password")) {
            res.code = 400; res.end(); return;
        }
        crow::json::wvalue root;
        root["token"] = "mock_token_123";
        root["user"]["username"] = x["username"].s();
        res.write(root.dump());
        cors_response(res);
        res.end();
    });

    // ── GET transactions ──────────────────────────────────────────────────────
    CROW_ROUTE(app, "/api/transactions").methods("GET"_method)
    ([&](crow::response& res) {
        auto txs = db.getAllTransactions();
        crow::json::wvalue x = crow::json::wvalue::list();
        for (size_t i = 0; i < txs.size(); i++) {
            x[i]["id"]          = txs[i].id;
            x[i]["description"] = txs[i].description;
            x[i]["amount"]      = txs[i].amount;
            x[i]["date"]        = txs[i].date;
            x[i]["category"]    = txs[i].category;
        }
        res.write(x.dump());
        cors_response(res);
        res.end();
    });

    // ── Summary ───────────────────────────────────────────────────────────────
    CROW_ROUTE(app, "/api/summary")
    ([&](crow::response& res) {
        auto txs     = db.getAllTransactions();
        auto budgets = db.getAllBudgets();

        double totalBalance = 0, totalIncome = 0, totalExpenses = 0, monthlyBudget = 0;
        for (const auto& b : budgets) monthlyBudget += b.target;
        for (const auto& t : txs) {
            totalBalance += t.amount;
            if (t.amount > 0) totalIncome    += t.amount;
            else              totalExpenses  += std::abs(t.amount);
        }

        crow::json::wvalue summary;
        summary["totalBalance"]  = totalBalance;
        summary["totalIncome"]   = totalIncome;
        summary["totalExpenses"] = totalExpenses;
        summary["monthlyBudget"] = monthlyBudget;

        res.write(summary.dump());
        cors_response(res);
        res.end();
    });

    // ── POST transaction (broadcasts WS event) ────────────────────────────────
    CROW_ROUTE(app, "/api/transactions").methods("POST"_method)
    ([&](const crow::request& req, crow::response& res) {
        auto x = crow::json::load(req.body);
        if (!x || !x.has("description") || !x.has("amount")) {
            res.code = 400; res.end(); return;
        }

        std::string desc     = x["description"].s();
        double      amount   = x["amount"].d();
        std::string date     = x.has("date")     ? std::string(x["date"].s())     : std::string("2023-01-01");
        std::string category = x.has("category") ? std::string(x["category"].s()) : std::string("General");

        bool success = db.addTransaction(desc, amount, date, category);
        if (success) {
            // Build the transaction payload for the broadcast
            std::string txPayload =
                "{\"description\":\"" + desc +
                "\",\"amount\":"      + std::to_string(amount) +
                ",\"date\":\""        + date +
                "\",\"category\":\""  + category + "\"}";

            // Broadcast: new_transaction
            ws_broadcast(make_event("new_transaction", txPayload));

            // Broadcast: updated summary
            auto txs     = db.getAllTransactions();
            auto budgets = db.getAllBudgets();
            double bal = 0, inc = 0, exp = 0, bud = 0;
            for (const auto& b : budgets) bud += b.target;
            for (const auto& t : txs) {
                bal += t.amount;
                if (t.amount > 0) inc += t.amount;
                else              exp += std::abs(t.amount);
            }
            std::string sumPayload =
                "{\"totalBalance\":"  + std::to_string(bal) +
                ",\"totalIncome\":"   + std::to_string(inc) +
                ",\"totalExpenses\":" + std::to_string(exp) +
                ",\"monthlyBudget\":" + std::to_string(bud) + "}";
            ws_broadcast(make_event("summary_updated", sumPayload));

            // Broadcast: budget_alert if any budget >= 80%
            std::string alerts = make_budget_alerts(budgets);
            if (alerts != "[]") {
                ws_broadcast(make_event("budget_alert", alerts));
            }
        }

        res.code = success ? 201 : 500;
        cors_response(res);
        res.end();
    });

    // ── PUT transaction ───────────────────────────────────────────────────────
    CROW_ROUTE(app, "/api/transactions/<int>").methods("PUT"_method)
    ([&](const crow::request& req, crow::response& res, int id) {
        auto x = crow::json::load(req.body);
        if (!x) { res.code = 400; res.end(); return; }

        bool success = db.updateTransaction(id,
            x["description"].s(), x["amount"].d(),
            x["date"].s(), x["category"].s());

        if (success) {
            ws_broadcast(make_event("transaction_updated", "{\"id\":" + std::to_string(id) + "}"));
        }

        res.code = success ? 200 : 500;
        cors_response(res);
        res.end();
    });

    // ── DELETE transaction ────────────────────────────────────────────────────
    CROW_ROUTE(app, "/api/transactions/<int>").methods("DELETE"_method)
    ([&](crow::response& res, int id) {
        bool success = db.deleteTransaction(id);
        if (success) {
            ws_broadcast(make_event("transaction_deleted", "{\"id\":" + std::to_string(id) + "}"));
            // Re-broadcast summary after delete
            auto txs     = db.getAllTransactions();
            auto budgets = db.getAllBudgets();
            double bal = 0, inc = 0, exp = 0, bud = 0;
            for (const auto& b : budgets) bud += b.target;
            for (const auto& t : txs) {
                bal += t.amount;
                if (t.amount > 0) inc += t.amount;
                else              exp += std::abs(t.amount);
            }
            std::string sumPayload =
                "{\"totalBalance\":"  + std::to_string(bal) +
                ",\"totalIncome\":"   + std::to_string(inc) +
                ",\"totalExpenses\":" + std::to_string(exp) +
                ",\"monthlyBudget\":" + std::to_string(bud) + "}";
            ws_broadcast(make_event("summary_updated", sumPayload));
        }
        res.code = success ? 200 : 500;
        cors_response(res);
        res.end();
    });

    // ── Predict ───────────────────────────────────────────────────────────────
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

    // ── GET budgets ───────────────────────────────────────────────────────────
    CROW_ROUTE(app, "/api/budgets").methods("GET"_method)
    ([&](crow::response& res) {
        auto budgets = db.getAllBudgets();
        crow::json::wvalue x = crow::json::wvalue::list();
        for (size_t i = 0; i < budgets.size(); i++) {
            x[i]["id"]       = budgets[i].id;
            x[i]["category"] = budgets[i].category;
            x[i]["target"]   = budgets[i].target;
            x[i]["current"]  = budgets[i].current;
        }
        res.write(x.dump());
        cors_response(res);
        res.end();
    });

    // ── POST budget (broadcasts) ──────────────────────────────────────────────
    CROW_ROUTE(app, "/api/budgets").methods("POST"_method)
    ([&](const crow::request& req, crow::response& res) {
        auto x = crow::json::load(req.body);
        if (!x || !x.has("category") || !x.has("target")) {
            res.code = 400; res.end(); return;
        }
        bool success = db.addBudget(x["category"].s(), x["target"].d(),
                                    x.has("current") ? x["current"].d() : 0.0);
        if (success) {
            ws_broadcast(make_event("budgets_updated"));
        }
        res.code = success ? 201 : 500;
        cors_response(res);
        res.end();
    });

    // ── GET AI chat history ───────────────────────────────────────────────────
    CROW_ROUTE(app, "/api/ai/chat").methods("GET"_method)
    ([&](crow::response& res) {
        auto history = db.getChatHistory();
        crow::json::wvalue x = crow::json::wvalue::list();
        for (size_t i = 0; i < history.size(); i++) {
            x[i]["role"]      = history[i].role;
            x[i]["content"]   = history[i].content;
            x[i]["timestamp"] = history[i].timestamp;
        }
        res.write(x.dump());
        cors_response(res);
        res.end();
    });

    // ── POST AI chat (SSE streaming) ──────────────────────────────────────────
    CROW_ROUTE(app, "/api/ai/chat").methods("POST"_method)
    ([&](const crow::request& req, crow::response& res) {
        auto x = crow::json::load(req.body);
        if (!x || !x.has("message")) { res.code = 400; res.end(); return; }

        std::string userMsg = x["message"].s();
        db.addChatMessage("user", userMsg);

        // Build AI response (same logic as before)
        auto txs     = db.getAllTransactions();
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
        if (lowerMsg.find("analyze") != std::string::npos ||
            lowerMsg.find("spend")   != std::string::npos ||
            lowerMsg.find("help")    != std::string::npos) {
            aiResponse = "I've analyzed your spending. ";
            if (categorySpending.empty()) {
                aiResponse += "You haven't recorded any expenses yet! Start adding some to get insights.";
            } else {
                auto topCat = std::max_element(categorySpending.begin(), categorySpending.end(),
                    [](const auto& a, const auto& b){ return a.second < b.second; });
                aiResponse += "Your highest spending is in **" + topCat->first +
                              "** (₹" + std::to_string((int)topCat->second) + "). ";
                aiResponse += "To reduce costs, try to limit non-essential purchases in this category. ";
                if (totalSpend > 5000)
                    aiResponse += "Also, your total monthly spending is quite high. "
                                  "I recommend setting a stricter budget for Entertainment.";
            }
        } else if (lowerMsg.find("hello") != std::string::npos ||
                   lowerMsg.find("hi")    != std::string::npos) {
            aiResponse = "Hello! I am your FinTrack AI assistant. How can I assist you with your finances today?";
        } else if (lowerMsg.find("balance") != std::string::npos) {
            aiResponse = "Your total balance is determined by your total income minus your expenses. "
                         "You can check the Dashboard for a real-time overview.";
        } else if (lowerMsg.find("budget") != std::string::npos) {
            aiResponse = "Setting budgets is a great way to save money! You have active budgets in your dashboard. "
                         "Would you like tips on how to stick to them?";
        } else if (lowerMsg.find("save")   != std::string::npos ||
                   lowerMsg.find("saving") != std::string::npos) {
            aiResponse = "To save more money, start by identifying non-essential expenses in categories like "
                         "Entertainment. Also, consider setting up a recurring transfer to a savings account.";
        } else {
            aiResponse = "That's an interesting question! Based on your financial data, I recommend watching "
                         "your expense trends. I am always learning to answer more of your questions.";
        }

        db.addChatMessage("ai", aiResponse);

        // ── SSE streaming: chunk the response word-by-word ────────────────────
        res.add_header("Content-Type",  "text/event-stream");
        res.add_header("Cache-Control", "no-cache");
        cors_response(res);

        // Split into words and stream each as an SSE event
        std::istringstream iss(aiResponse);
        std::string word;
        std::string sseBody;
        while (iss >> word) {
            sseBody += "data: " + word + " \n\n";
        }
        sseBody += "data: [DONE]\n\n";

        res.write(sseBody);
        res.end();
    });

    // ── WebSocket client count (for debugging) ────────────────────────────────
    CROW_ROUTE(app, "/api/ws/clients")
    ([&](crow::response& res) {
        std::lock_guard<std::mutex> lock(ws_mutex);
        crow::json::wvalue root;
        root["connected"] = (int)ws_clients.size();
        res.write(root.dump());
        cors_response(res);
        res.end();
    });

    std::cout << "FinTrack C++ Backend running on port 8080 (WebSocket + SSE enabled)..." << std::endl;
    app.port(8080).multithreaded().run();
}
