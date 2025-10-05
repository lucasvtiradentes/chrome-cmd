#!/bin/bash

folders=()

find_folders() {
  for dir in $(find . -maxdepth 3 -type d \( -name "node_modules" -o -name "dist" -o -name ".next" \)); do
    folders+=("$dir")
  done
}

find_folders

for folder in "${folders[@]}"; do
  echo "Apagando $folder..."
  rm -rf "$folder"  # Apaga a pasta de forma recursiva e forçada
done
