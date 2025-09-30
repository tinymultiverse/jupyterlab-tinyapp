# Introduction 

Dockerfile to build TinyApp image that contains Jupyterlab, TinyApp extension, and App packages (i.e. Streamlit, Dash).

Refer to [tinyapp](http://todo) to set up TinyApp framework in your Kubernetes cluster.

# Run

#### JupyterLab Mode

Refer to [Jupyter Docker Stacks](https://jupyter-docker-stacks.readthedocs.io/en/latest/index.html).

See [environment variables](http://todo) required/supported by TinyApp extension.

#### App Mode

There are two easy ways to deploy TinyApp to Kubernetes:

1. Once development/preview is complete using this image (Jupyterlab mode), JupyterLab TinyApp extension lets you deploy App as a standalone instance (which will run this image in App mode). Make sure to set TINY_APP_IMAGE env var to JupyterLab container. It's a good practice to use the same image version for both JupyterLab and TinyApp deployments to ensure a consistent environment.

2. Use [tinyapp-ui](http://todo) deploy TinyApp instance.

###### Environment Variables

| Environment Variable            | Required                      | Description |
|---------------------------------|-------------------------------|-------------|
| BASE_DIR                        | yes                           | working directory |
| MAIN_FILE                       | yes                           | path of app main file, relative to BASE_DIR |
| REQUIREMENTS_FILE               | no                            | path of requirements file, relative to BASE_DIR |
| TINY_APP_TYPE                   | yes                           | "streamlit" or "dash" |
| STREAMLIT_PORT                  | if TINY_APP_TYPE is streamlit | streamlit port |
| DASH_PORT                       | if TINY_APP_TYPE is dash      | dash port |
| STREAMLIT_BASE_URL              | no                            | base url for streamlit |
| DASH_URL_BASE_PATHNAME          | no                            | base url for dash |
