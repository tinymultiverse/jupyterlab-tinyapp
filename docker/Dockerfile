FROM quay.io/jupyter/base-notebook:python-3.11

USER root

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
    libpq-dev \
    nodejs \
    npm \
    yarn

# COPY start-tinyapp.sh start-tinyapp.py /usr/local/bin/

USER root

# TODO install from PyPi
COPY . .
RUN pip install build
RUN python -m build -w
# COPY jupyterlab_tinyapp-1.0.0-py3-none-any.whl .
RUN pip install ./dist/jupyterlab_tinyapp-1.0.0-py3-none-any.whl

USER ${NB_UID}
USER root
