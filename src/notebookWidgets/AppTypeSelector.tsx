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
import { HTMLSelect } from '@jupyterlab/ui-components';
import { ReactWidget } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel, INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { CommandRegistry } from '@lumino/commands';
import { IDisposable } from '@lumino/disposable';
import { AppType } from '../utils/constants';

const INSERT_AFTER_WIDGET = 'spacer';

const appTypeToLabel = (appType: AppType): string => {
  return appType.toString()
};

const AppTypeSelector = (): React.ReactElement => {
  return (
    <HTMLSelect aria-label="App Type" className={'app-type-selector'}>
      <option value={AppType.STREAMLIT}>{appTypeToLabel(AppType.STREAMLIT)}</option>
      <option value={AppType.DASH}>{appTypeToLabel(AppType.DASH)}</option>
    </HTMLSelect>
  );
};

class TinyAppSelectorWidget
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  constructor(commands: CommandRegistry, tracker: INotebookTracker) {
    this.commands = commands;
    this.tracker = tracker;
  }
  protected commands: CommandRegistry;
  protected tracker: INotebookTracker;

  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    const appTypeSelector = ReactWidget.create(<AppTypeSelector />);
    panel.toolbar.insertAfter(INSERT_AFTER_WIDGET, "", appTypeSelector);
    return appTypeSelector;
  }
}

export default TinyAppSelectorWidget;
