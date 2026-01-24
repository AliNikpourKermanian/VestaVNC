#!/bin/bash

echo "---------------------------------------------------"
echo "  Rebuilding VestaVNC UI..."
echo "---------------------------------------------------"

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "Error: 'npm' is not installed in this environment."
    echo "Please install Node.js/npm to build the UI."
    exit 1
fi

cd vesta/vesta-ui

echo "Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "Dependencies already installed. Skipping 'npm install'."
fi

echo "Building React App..."
npm run build

echo "Updating Core Assets..."
# Copy dist contents to parent directory (vesta root)
cp -r dist/* ../

echo "---------------------------------------------------"
echo "UI Rebuild Complete!"
echo "Refresh your browser to see changes."
echo "---------------------------------------------------"
