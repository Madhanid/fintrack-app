#pragma once
#include <sqlite3.h>
#include <string>
#include <vector>
#include <iostream>

struct Transaction {
    int id;
    std::string description;
    double amount;
    std::string date;
    std::string category;
};

struct Budget {
    int id;
    std::string category;
    double target;
    double current;
};

struct ChatMessage {
    int id;
    std::string role; // "user" or "ai"
    std::string content;
    std::string timestamp;
};

class Database {
public:
    Database(const char* dbPath) {
        if (sqlite3_open(dbPath, &db) != SQLITE_OK) {
            std::cerr << "Can't open database: " << sqlite3_errmsg(db) << std::endl;
        }
        createTable();
    }

    ~Database() {
        sqlite3_close(db);
    }

    void createTable() {
        const char* sql = "CREATE TABLE IF NOT EXISTS transactions ("
                          "id INTEGER PRIMARY KEY AUTOINCREMENT,"
                          "description TEXT NOT NULL,"
                          "amount REAL NOT NULL,"
                          "date TEXT NOT NULL,"
                          "category TEXT NOT NULL);"
                          "CREATE TABLE IF NOT EXISTS budgets ("
                          "id INTEGER PRIMARY KEY AUTOINCREMENT,"
                          "category TEXT UNIQUE NOT NULL,"
                          "target REAL NOT NULL,"
                          "current REAL NOT NULL);"
                          "CREATE TABLE IF NOT EXISTS messages ("
                          "id INTEGER PRIMARY KEY AUTOINCREMENT,"
                          "role TEXT NOT NULL,"
                          "content TEXT NOT NULL,"
                          "timestamp TEXT NOT NULL);"
                          "CREATE TABLE IF NOT EXISTS users ("
                          "id INTEGER PRIMARY KEY AUTOINCREMENT,"
                          "username TEXT UNIQUE NOT NULL,"
                          "password TEXT NOT NULL);";
        char* errMsg = 0;
        sqlite3_exec(db, sql, 0, 0, &errMsg);
    }

    bool addTransaction(const std::string& desc, double amount, const std::string& date, const std::string& category) {
        const char* sql = "INSERT INTO transactions (description, amount, date, category) VALUES (?, ?, ?, ?);";
        sqlite3_stmt* stmt;
        
        if (sqlite3_prepare_v2(db, sql, -1, &stmt, 0) != SQLITE_OK) return false;
        
        sqlite3_bind_text(stmt, 1, desc.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_double(stmt, 2, amount);
        sqlite3_bind_text(stmt, 3, date.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 4, category.c_str(), -1, SQLITE_TRANSIENT);
        
        bool success = sqlite3_step(stmt) == SQLITE_DONE;
        sqlite3_finalize(stmt);
        return success;
    }

    bool updateTransaction(int id, const std::string& desc, double amount, const std::string& date, const std::string& category) {
        const char* sql = "UPDATE transactions SET description = ?, amount = ?, date = ?, category = ? WHERE id = ?;";
        sqlite3_stmt* stmt;
        
        if (sqlite3_prepare_v2(db, sql, -1, &stmt, 0) != SQLITE_OK) return false;
        
        sqlite3_bind_text(stmt, 1, desc.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_double(stmt, 2, amount);
        sqlite3_bind_text(stmt, 3, date.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 4, category.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_int(stmt, 5, id);
        
        bool success = sqlite3_step(stmt) == SQLITE_DONE;
        sqlite3_finalize(stmt);
        return success;
    }

    bool deleteTransaction(int id) {
        const char* sql = "DELETE FROM transactions WHERE id = ?;";
        sqlite3_stmt* stmt;
        
        if (sqlite3_prepare_v2(db, sql, -1, &stmt, 0) != SQLITE_OK) return false;
        
        sqlite3_bind_int(stmt, 1, id);
        
        bool success = sqlite3_step(stmt) == SQLITE_DONE;
        sqlite3_finalize(stmt);
        return success;
    }

    std::vector<Transaction> getAllTransactions() {
        std::vector<Transaction> transactions;
        const char* sql = "SELECT id, description, amount, date, category FROM transactions ORDER BY date DESC;";
        sqlite3_stmt* stmt;
        
        if (sqlite3_prepare_v2(db, sql, -1, &stmt, 0) == SQLITE_OK) {
            while (sqlite3_step(stmt) == SQLITE_ROW) {
                transactions.push_back({
                    sqlite3_column_int(stmt, 0),
                    reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1)),
                    sqlite3_column_double(stmt, 2),
                    reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3)),
                    reinterpret_cast<const char*>(sqlite3_column_text(stmt, 4))
                });
            }
        }
        sqlite3_finalize(stmt);
        return transactions;
    }

    bool addBudget(const std::string& category, double target, double current) {
        const char* sql = "INSERT OR REPLACE INTO budgets (category, target, current) VALUES (?, ?, ?);";
        sqlite3_stmt* stmt;
        if (sqlite3_prepare_v2(db, sql, -1, &stmt, 0) != SQLITE_OK) return false;
        sqlite3_bind_text(stmt, 1, category.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_double(stmt, 2, target);
        sqlite3_bind_double(stmt, 3, current);
        bool success = sqlite3_step(stmt) == SQLITE_DONE;
        sqlite3_finalize(stmt);
        return success;
    }

    std::vector<Budget> getAllBudgets() {
        std::vector<Budget> budgets;
        const char* sql = "SELECT id, category, target, current FROM budgets;";
        sqlite3_stmt* stmt;
        if (sqlite3_prepare_v2(db, sql, -1, &stmt, 0) == SQLITE_OK) {
            while (sqlite3_step(stmt) == SQLITE_ROW) {
                budgets.push_back({
                    sqlite3_column_int(stmt, 0),
                    reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1)),
                    sqlite3_column_double(stmt, 2),
                    sqlite3_column_double(stmt, 3)
                });
            }
        }
        sqlite3_finalize(stmt);
        return budgets;
    }

    bool deleteBudget(int id) {
        const char* sql = "DELETE FROM budgets WHERE id = ?;";
        sqlite3_stmt* stmt;
        if (sqlite3_prepare_v2(db, sql, -1, &stmt, 0) != SQLITE_OK) return false;
        sqlite3_bind_int(stmt, 1, id);
        bool success = sqlite3_step(stmt) == SQLITE_DONE;
        sqlite3_finalize(stmt);
        return success;
    }

    bool addChatMessage(const std::string& role, const std::string& content) {
        const char* sql = "INSERT INTO messages (role, content, timestamp) VALUES (?, ?, datetime('now'));";
        sqlite3_stmt* stmt;
        if (sqlite3_prepare_v2(db, sql, -1, &stmt, 0) != SQLITE_OK) return false;
        sqlite3_bind_text(stmt, 1, role.c_str(), -1, SQLITE_TRANSIENT);
        sqlite3_bind_text(stmt, 2, content.c_str(), -1, SQLITE_TRANSIENT);
        bool success = sqlite3_step(stmt) == SQLITE_DONE;
        sqlite3_finalize(stmt);
        return success;
    }

    std::vector<ChatMessage> getChatHistory() {
        std::vector<ChatMessage> messages;
        const char* sql = "SELECT id, role, content, timestamp FROM messages ORDER BY timestamp ASC;";
        sqlite3_stmt* stmt;
        if (sqlite3_prepare_v2(db, sql, -1, &stmt, 0) == SQLITE_OK) {
            while (sqlite3_step(stmt) == SQLITE_ROW) {
                messages.push_back({
                    sqlite3_column_int(stmt, 0),
                    reinterpret_cast<const char*>(sqlite3_column_text(stmt, 1)),
                    reinterpret_cast<const char*>(sqlite3_column_text(stmt, 2)),
                    reinterpret_cast<const char*>(sqlite3_column_text(stmt, 3))
                });
            }
        }
        sqlite3_finalize(stmt);
        return messages;
    }

private:
    sqlite3* db;
};
