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

import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { requestAPI } from '../middleware';
import {
  IframeContainer,
  LoadingView,
  ResultContainer,
  ResultType,
  ViewType
} from '../components/Common';
import { delay, getSelectedAppType, makeRandomStr } from '../utils/common';

let loadingWidget: any;
let errorWidget: any;
let widget: any;

let previewId: string;

const maxWaitTime = 1 * 60 * 1000; // 1 minutes in ms
const pingInterval = 1 * 1000; // 3 seconds in ms

// pings the app url
const ping = async (url: string): Promise<boolean> => {
  return new Promise(resolve => {
    requestAPI<any>('ping', {
      body: JSON.stringify({
        url: url
      }),
      method: 'POST'
    })
      .then(result => result.data)
      .then(result => resolve(result.ok));
  });
};

const loadingTimeout = (t0: Date, maxMilliseconds: number): boolean => {
  const tn = new Date();
  const timeDeltaMilliseconds = tn.getTime() - t0.getTime();
  return timeDeltaMilliseconds > maxMilliseconds;
};

const makeTimeoutError = (): Error => {
  const t = new Date(maxWaitTime);
  const timeFormat = `${t.getMinutes()}m ${t.getSeconds()}s`;
  return new Error(`loading preview timed out after ${timeFormat}`);
};

export const previewExecutor = async (
  tracker: INotebookTracker,
  shell: JupyterFrontEnd.IShell
): Promise<void> => {
  const previewIdLocal = makeRandomStr(7);
  previewId = previewIdLocal;

  if (loadingWidget) {
    loadingWidget.close();
  }
  if (errorWidget) {
    errorWidget.close();
  }
  if (widget) {
    widget.close();
  }

  loadingWidget = ReactWidget.create(<LoadingView viewType={ViewType.MAIN} />);
  loadingWidget.id = 'preview-widget-loading';
  loadingWidget.title.label = 'Loading App Preview';
  loadingWidget.title.iconClass = 'app-icon fas fa-clock';
  loadingWidget.title.closable = true;
  shell.add(loadingWidget);

  var appType = ""
  var notebookPath = ""
  if (tracker.currentWidget == null) {
    appType = getSelectedAppType("")
  } else {
    appType = getSelectedAppType(tracker.currentWidget.id);
    notebookPath = tracker.currentWidget.context.path;
  }

  var result: any
  try {
    result = await requestAPI<any>('preview', {
      body: JSON.stringify({
        notebookPath: notebookPath,
        appType: appType,
      }),
      method: 'POST'
    })

    // ping url until it's up
    // also set timer for timeout
    const t0 = new Date();
    let ok = false;
    while (!ok) {
      if (loadingTimeout(t0, maxWaitTime)) {
        throw makeTimeoutError();
      }
      ok = await ping(result.data.appURL);
      console.log('ready: ' + ok.toString());
      await delay(pingInterval);
    }
    console.log('successfully loaded application in preview mode');
  } catch (error) {
    console.error('error while creating preview app:', error);
    if (previewIdLocal == previewId) {
      loadingWidget.close();
      
      errorWidget = ReactWidget.create(
        <ResultContainer
          viewType={ViewType.MAIN}
          resultType={ResultType.ERROR}
          title={'Error loading app preview'}
          message={'Please check logs for details'}
        />
      );
      errorWidget.id = 'preview-widget-error';
      errorWidget.title.iconClass = 'error-icon fas fa-exclamation-circle';
      errorWidget.title.label = 'Error';
      errorWidget.title.closable = true;
      
      shell.add(errorWidget);
    }
    return
  }

  // remove loading widget and add the iframe widget
  // TODO if log widget exists, new widget pushes it to right - need to fix.
  if (previewIdLocal == previewId) {
    loadingWidget.close();

    widget = ReactWidget.create(
      <IframeContainer url={result.data.appURL} title="local-app" />
    );
    widget.id = 'preview-widget';
    widget.title.label = `App Preview`;
    widget.title.iconClass = 'app-icon fas fa-rocket';
    widget.title.closable = true;
    
    shell.add(widget);
  }

};