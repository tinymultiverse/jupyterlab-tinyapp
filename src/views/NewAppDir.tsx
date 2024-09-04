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

import { InputDialog, showErrorMessage, showDialog } from '@jupyterlab/apputils';
import { CommandRegistry } from '@lumino/commands';
import {
  IDocumentManager,
} from '@jupyterlab/docmanager';

import { KernelAPI } from '@jupyterlab/services'
import { requestAPI } from '../middleware';

const createNewAppDir = async (commands: CommandRegistry, docManager: IDocumentManager, appDirectory: string): Promise<void> => {
  var result: any;
  try {
    result = await requestAPI<any>('new_app_dir', {
      body: JSON.stringify({
        appDirectory: appDirectory
      }),
      method: 'POST'
    });
  } catch (e: any) {
    showErrorMessage('failed to create app directory', e)
  }

  await commands.execute('filebrowser:go-to-path', { path: appDirectory })

  var kernelName = 'python3'

  const kernels = await KernelAPI.listRunning()
  if (kernels.length > 100) {
    kernelName = kernels[0]['name']
  }

  docManager.open(appDirectory + '/main.ipynb', 'default', {  name: kernelName } )

  // TODO save notebook
  // await commands.execute('docmanager:save')

  await showDialog({
    title: 'Successfully created app directory',
    body: 'initialized at ' + result.data.path,
    hasClose: false,
    buttons: [
      {
        label: 'Close', // Button label
        caption: 'Close', // Button title
        className: '', // Additional button CSS class
        accept: true, // Whether this button will discard or accept the dialog
        displayType: 'default', // applies 'default' or 'warn' styles
        ariaLabel: "",
        iconClass: "",
        iconLabel: "",
        actions: [],
      }
    ]
  });
};

export const newAppDirExecutor = async (
  commands: CommandRegistry,
  docManager: IDocumentManager,
): Promise<void> => {

  const input = await InputDialog.getText({ title: 'Enter App Directory Name' })

  const val = input.value
  if (val !== null) {
    await createNewAppDir(commands, docManager, val)
  }
};
