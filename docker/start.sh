#!/bin/bash

# Check if RUN_TINYAPP environment variable is equal to "true" (case-insensitive)
if [[ "${RUN_TINYAPP,,}" == "true" ]]; then
    echo "RUN_TINYAPP is true, starting TinyApp..."
    exec python start-tinyapp.py "$@"
else
    echo "RUN_TINYAPP is not true, starting standard Jupyter notebook..."
    exec start-notebook.py "$@"
fi