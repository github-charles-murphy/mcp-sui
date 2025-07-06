FROM node:20-bullseye

# Install build dependencies for Sui CLI
RUN apt-get update \
    && apt-get install -y curl git build-essential libssl-dev pkg-config clang cmake \
    && rm -rf /var/lib/apt/lists/*

# Install Rust for building Sui CLI
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Build Sui CLI from source
ARG SUI_BRANCH=mainnet
RUN cargo install --locked --git https://github.com/MystenLabs/sui.git --branch $SUI_BRANCH sui

WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm install

COPY . .
RUN npm run build

ENV PORT=8000
EXPOSE 8000
CMD ["node", "dist/index.js"]
