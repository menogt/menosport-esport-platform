#!/usr/bin/env bash
cd "$(dirname "$0")"
echo "Esports Tournament Platform - Dev Server"
echo "Installing dependencies..."
npm install || { echo "npm install failed. Install Node.js LTS first."; exit 1; }
echo "Starting Vite dev server..."
echo "Open the Local URL shown below in your browser."
npm run dev
