# TinyApp Extension User Guide

## App Directory

To get started, create app directory.

![create app directory](./assets/new-app-directory.png)

## App Preview

App preview runs an app process within the same Docker container (or local machine) where you're running this extension.

![app preview](./assets/app-preview.gif)

## Deploy App

Once finished with testing your app, you can now publish it as a standalone deployment.

![app publish](./assets/app-publish.gif)

## Generate App with AI

You can generate an app from natural language description.

![generate app](./assets/generate-app.gif)

Generate app from an image:

![generate from image](./assets/generate-from-image.gif)

Continusouly chat with the model to update & iterate on your app.

Note: When generating, choose the Action below the Generate button to explicitly select whether you want to create a new app or modify the currently open notebook. If you choose "Create new app" while the notebook already has code, the request will be rejected. Likewise, choosing "Modify existing app" requires existing code in the notebook.