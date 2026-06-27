# Gunakan image Node.js versi resmi
FROM node:20-alpine

# Tentukan folder kerja di dalam container Docker
WORKDIR /usr/src/app

# Salin file package.json dan package-lock.json terlebih dahulu
COPY package*.json ./

# Install library pendukung aplikasi
RUN npm install

# Salin semua source code (termasuk folder src) ke dalam container
COPY . .

# Buka port sesuai aplikasi kita (Board Service jalan di 3003)
EXPOSE 3003

# Perintah untuk menjalankan aplikasi
CMD ["node", "src/app.js"]
