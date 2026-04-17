cmake_minimum_required(VERSION 3.10)
project(FinTrackBackend)

set(CMAKE_CXX_STANDARD 17)

find_package(Crow REQUIRED)
find_package(SQLite3 REQUIRED)

include_directories(${CROW_INCLUDE_DIRS} ${SQLITE3_INCLUDE_DIRS})

add_executable(fintrack_server main.cpp)
target_link_libraries(fintrack_server Crow::Crow sqlite3 pthread)
