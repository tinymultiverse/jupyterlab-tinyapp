/*
Copyright 2024 BlackRock, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React, { useState } from 'react';
import { INotebookTracker } from '@jupyterlab/notebook';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';

import {
  LoadingView,
  ResultContainer,
  ResultType,
  StyledTextInputField,
  ViewType
} from '../components/Common';
import { PathExt } from '@jupyterlab/coreutils';
import { ThemeProvider } from '@material-ui/styles';
import { theme } from '../style/theme';
import { Button, FormControl, Typography } from '@material-ui/core';
import { requestAPI } from '../middleware';
import { useStyles } from '../style/styles';
import { getSelectedAppType } from '../utils/common';

export const publishExecutor = async (
  tracker: INotebookTracker,
  shell: JupyterFrontEnd.IShell
): Promise<void> => {
  var appType = ""
  var notebookPath = ""
  if (tracker.currentWidget != null) {
    appType = getSelectedAppType(tracker.currentWidget.id);
    notebookPath = tracker.currentWidget.context.path;
  }
  const widget = ReactWidget.create(
    <PublishForm notebookPath={notebookPath} appType={appType} />
  );
  widget.id = 'publish-widget';
  widget.title.iconClass = 'app-icon fas fa-rocket';
  widget.title.label = `Publish ${PathExt.basename(notebookPath, '.ipynb')}`;
  widget.title.closable = true;
  shell.add(widget);
};

const successMessage =
  'You can launch view your app from the "Published Apps" button in the side panel';

interface IPublishFormProps {
  notebookPath: string;
  appType: string;
}
const PublishForm = (props: IPublishFormProps): any => {
  const classes = useStyles();
  const { notebookPath, appType } = props;
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultType, setResultType] = useState(ResultType.NULL);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  const timestamp = new Date().getTime();

  const notebookName = PathExt.basename(notebookPath);

  const resultContainer = showResult && (
    <ResultContainer
      title={title}
      message={message}
      viewType={ViewType.PARTIAL}
      resultType={resultType}
    />
  );

  const loadingView = isLoading && <LoadingView viewType={ViewType.PARTIAL} />;

  const submitHandler = async (): Promise<void> => {
    setShowResult(false);
    setIsLoading(true);

    const appTitle = (document.getElementById(
      `appTitle-${timestamp}`
    ) as HTMLInputElement).value;
    const appDescription = (document.getElementById(
      `appDescription-${timestamp}`
    ) as HTMLInputElement).value;

  await  requestAPI<any>('publish', {
      body: JSON.stringify({
        notebookPath: notebookPath,
        appTitle: appTitle,
        appDescription: appDescription,
        appType: appType,
      }),
      method: 'POST'
    })
      .then(result => result.data)
      .then(result => {
        setResultType(ResultType.SUCCESS);
        setTitle('Your app has been published');
        setMessage(successMessage);
      })
      .catch((error: any) => {
        setResultType(ResultType.ERROR);
        setTitle('Error publishing your app');
        setMessage(error.toString())
      })
      .finally(() => {
        setIsLoading(false);
        setShowResult(true);
      });
  };

  return (
    <div className={classes.formContainer}>
      <ThemeProvider theme={theme}>
        <Typography component="h1" variant="h4" color="textPrimary">
          Publish {notebookName}
        </Typography>
        <br />
        <div>
          <FormControl fullWidth>
            <StyledTextInputField
              id="notebookPath"
              disabled
              label="Notebook Path"
              value={notebookPath}
            />
          </FormControl>
          <FormControl fullWidth>
            <StyledTextInputField
              id={`appTitle-${timestamp}`}
              label="App Title"
              disabled={isLoading}
            />
          </FormControl>
          <FormControl fullWidth>
            <StyledTextInputField
              id={`appDescription-${timestamp}`}
              label="App Description"
              disabled={isLoading}
            />
          </FormControl>
        </div>
        <Button
          disabled={isLoading}
          variant="contained"
          color="primary"
          onClick={submitHandler}
        >
          Publish
        </Button>
      </ThemeProvider>
      {loadingView}
      {resultContainer}
    </div>
  );
};