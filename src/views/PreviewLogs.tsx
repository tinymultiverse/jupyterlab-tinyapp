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
import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';

import { LogsDisplay } from '../components/Logs'
import { requestAPI } from '../middleware';

let previewLogsWidget: any;

const fetchPreviewLogs = async (): Promise<string> => {
  const result = await requestAPI<any>('preview_logs', {method: 'GET'})
  return result.data.logs
};

export const previewLogsExecutor = async (
  shell: JupyterFrontEnd.IShell
): Promise<void> => {
  if (previewLogsWidget) {
    previewLogsWidget.close();
  }

  previewLogsWidget = ReactWidget.create(<LogsDisplay fetchLogs={fetchPreviewLogs} shouldShowCloseButton={false}
    appName='App Preview' handleClose={() => {}} />);

  previewLogsWidget.id = 'logs-for-app-preview-widget';
  previewLogsWidget.title.iconClass = 'app-icon fas fa-user-alt';
  previewLogsWidget.title.label = 'Logs for App Preview';
  previewLogsWidget.title.closable = true;

  shell.add(previewLogsWidget);
};
