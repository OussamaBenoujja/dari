FROM node:20-bullseye-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 make g++ libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
	&& npm install \
	&& apt-get purge -y --auto-remove \
	&& rm -rf /var/lib/apt/lists/*
COPY . .
CMD ["node","src/app.js"]
