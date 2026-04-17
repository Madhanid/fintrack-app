# Build stage
FROM ubuntu:22.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    libsqlite3-dev \
    libasio-dev \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Crow (using specific version for stability)
RUN git clone https://github.com/CrowCpp/Crow.git && \
    cd Crow && mkdir build && cd build && \
    cmake .. -DCROW_BUILD_EXAMPLES=OFF -DCROW_BUILD_TESTS=OFF && \
    make install

WORKDIR /app
COPY . .

RUN rm -rf build && mkdir build && cd build && \
    cmake .. && \
    make

# Final stage
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    libsqlite3-0 \
    libssl3 \
    libstdc++6 \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/build/fintrack_server .
# Ensure we have a place for the database and correct permissions
RUN mkdir -p db

EXPOSE 8080

CMD ["./fintrack_server"]
