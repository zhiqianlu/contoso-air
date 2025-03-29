#!/bin/bash

input_file="$1"

if [ ! -f "$input_file" ]; then
    echo "Error: File not found!"
    exit 1
fi

city_names=$(jq -r '.[] | select(.image == null) | .city' "$input_file")

for city in $city_names; do
    echo "A photo realistic and detailed, high definition picture shot with a medium format camera of $city, capturing its essence, famous landmarks, cultural atmosphere, or scenic beauty. Include rich architectural details, lively streets, or an authentic feel that represents the city's unique charm."
    echo ""
done