FROM quay.io/jupyter/base-notebook:python-3.11

USER root

RUN apt-get update -y && \
    apt-get install -y --no-install-recommends \
    libpq-dev \
    nodejs \
    npm \
    yarn

RUN pip install streamlit build

# TODO install from PyPi
COPY . .
RUN python -m build -w
RUN pip install ./dist/jupyterlab_tinyapp-1.0.0-py3-none-any.whl

COPY docker/start.sh docker/start-tinyapp.sh docker/start-tinyapp.py /usr/local/bin/
ENTRYPOINT ["tini", "-g", "--"]
CMD ["start.sh"]

USER ${NB_UID}
