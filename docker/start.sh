#!/bin/bash

# Check if RUN_TINYAPP environment variable is equal to "true" (case-insensitive)
if [[ "${RUN_TINYAPP,,}" == "true" ]]; then
    echo "RUN_TINYAPP is true, starting TinyApp..."
    exec python start-tinyapp.py --ServerApp.base_url="${JUPYTER_BASE_URL}" "$@"
else
    echo "RUN_TINYAPP is not true, starting standard Jupyter notebook..."
    exec start-notebook.py --ServerApp.token='' --ServerApp.base_url="${JUPYTER_BASE_URL}" "$@"
fi