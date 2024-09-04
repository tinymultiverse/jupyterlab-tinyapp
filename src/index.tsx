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
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { INotebookTracker } from '@jupyterlab/notebook';
import { ReactWidget, showDialog, Dialog } from '@jupyterlab/apputils';

import TinyAppButtonWidget from './notebookWidgets/TinyAppButtonWidget';
import { TinyAppPanelWidget } from './panelWidgets/TinyAppPanelWidget';
import { newAppDirExecutor } from './views/NewAppDir';
import { generateAppExecutor } from './views/GenerateApp';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { previewExecutor } from './views/Preview';
import { previewLogsExecutor } from './views/PreviewLogs';
import { publishExecutor } from './views/Publish';
import { CustomWidgetCommand } from './utils/constants';
import { listAppsExecutor } from './views/ListApps';
import TinyAppSelectorWidget from './notebookWidgets/AppTypeSelector';
import { requestAPI } from './middleware';
import { rocketIcon } from './icons/icon';
import { EnvVars } from './utils/common';

const WIDGET_TARGET = 'Notebook';

/* Main entry point into the extension
 this is where all commands are built and added to the notebook widget bar
 ----------------------------------------------------------------------------------------- */
const extension: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab/tinyapp:plugin',
  autoStart: true,
  requires: [INotebookTracker, IDocumentManager],
  activate: async (app: JupyterFrontEnd, tracker: INotebookTracker, docManager: IDocumentManager) => {
    const { commands, shell, docRegistry } = app;

    // new app directory
    commands.addCommand(CustomWidgetCommand.NEW_APP, {
      execute: async (_: any) => newAppDirExecutor(commands, docManager),
      label: 'New App Directory',
      isEnabled: () => true
    });

    // generate app with ai
    commands.addCommand(CustomWidgetCommand.GENERATE_APP, {
      execute: async (args: any) => {
        if (!envVars.ai_enabled) {
          console.warn('AI features are disabled. Cannot generate app.');
          showDialog({
            title: 'AI Disabled',
            body: 'AI features are currently disabled. Cannot generate app.',
            buttons: [Dialog.okButton({ label: 'OK' })]
          });
          return;
        }
        await generateAppExecutor(commands, tracker, docManager, args);
      },
      label: 'Generate App',
      isEnabled: () => envVars.ai_enabled
    });

    // list apps
    commands.addCommand(CustomWidgetCommand.LIST_APPS, {
      execute: async (_: any) => listAppsExecutor(shell),
      label: 'Published Apps',
      isEnabled: () => true
    });

    // preview
    commands.addCommand(CustomWidgetCommand.PREVIEW, {
      execute: async (_: any) => previewExecutor(tracker, shell),
      label: 'Preview App',
      isEnabled: () => true,
      iconClass: 'app-launcher-notebook-button-icon fas fa-drafting-compass'
    });

    // preview logs
    commands.addCommand(CustomWidgetCommand.PREVIEW_LOGS, {
      execute: async (_: any) => previewLogsExecutor(shell),
      label: 'Logs',
      isEnabled: () => true,
      iconClass: 'app-launcher-notebook-button-icon fas fa-book-open'
    });

    // publish
    commands.addCommand(CustomWidgetCommand.PUBLISH, {
      execute: async (_: any) => publishExecutor(tracker, shell),
      label: 'Publish App',
      isEnabled: () => true,
      iconClass: 'app-launcher-notebook-button-icon fas fa-rocket'
    });

    // register notebook menu buttons
    const appTypeSelector = new TinyAppSelectorWidget(commands, tracker);
    const previewButton = new TinyAppButtonWidget(
      commands,
      CustomWidgetCommand.PREVIEW
    );
    const previewLogsButton = new TinyAppButtonWidget(
      commands,
      CustomWidgetCommand.PREVIEW_LOGS
    )
    const publishButton = new TinyAppButtonWidget(
      commands,
      CustomWidgetCommand.PUBLISH
    );

    docRegistry.addWidgetExtension(WIDGET_TARGET, publishButton);
    docRegistry.addWidgetExtension(WIDGET_TARGET, previewLogsButton);
    docRegistry.addWidgetExtension(WIDGET_TARGET, previewButton);
    docRegistry.addWidgetExtension(WIDGET_TARGET, appTypeSelector);

    var envVars: EnvVars = {
      ai_enabled: false,
    }
    
    try {
      envVars = await requestAPI<any>('get_env_vars', {
        method: 'GET'
      })
    } catch (e: any) {
      console.error('failed to get env vars from server', e)
    }

    // register left panel widget
    const tinyAppSideBarWidget = ReactWidget.create(
      <TinyAppPanelWidget commands={commands} envVars={envVars}/>
    );
    tinyAppSideBarWidget.id = 'app-launcher-sidebar-widget';
    tinyAppSideBarWidget.title.icon = rocketIcon
    tinyAppSideBarWidget.title.caption = 'Tiny Apps';
    app.shell.add(tinyAppSideBarWidget, 'left', { rank: 200 });
  }
};

export default extension;
