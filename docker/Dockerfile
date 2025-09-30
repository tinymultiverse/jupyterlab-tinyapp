FROM ubuntu:oracular-20240811.1

RUN apt-get update --yes && \
    apt-get upgrade --yes && \
    apt-get install --yes --no-install-recommends \
    # Necessary to extract the micromamba executable
    bzip2 \
    ca-certificates \
    libpq-dev
    tini \
    build-essential \
    ssh \
    wget && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

ENV CONDA_ENV_NAME=python3 \
    CONDA_DIR=/opt/conda \
    SHELL=/bin/bash \
ENV PATH="${CONDA_DIR}/bin:${PATH}"

ARG PYTHON_VERSION=3.12

# "jovyan" from base image
USER ${NB_UID}

RUN conda install --yes \
    'streamlit' \
    'gunicorn' \
    'dash' && \
    fix-permissions "${CONDA_DIR}"

COPY start-tinyapp.sh start-tinyapp.py /usr/local/bin/

USER root

# TODO install from PyPi
COPY jupyterlab_tinyapp-1.0.0-py3-none-any.whl .
RUN pip install ./jupyterlab_tinyapp-1.0.0-py3-none-any.whl

USER ${NB_UID}
USER root
