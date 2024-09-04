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

import { DocumentRegistry } from '@jupyterlab/docregistry';
import { CommandRegistry } from '@lumino/commands';
import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';
import { CommandToolbarButton } from '@jupyterlab/apputils';
import { IDisposable } from '@lumino/disposable';

const INSERT_AFTER_WIDGET = 'spacer';

/*
TinyAppButtonWidget:
class wrapper for an extension button within the notebook widget

Note: each widget is added to the bar after the spacer. This means to order your
widgets 1, 2, 3 you will need to add them in order 3, 2, 1
 */
class TinyAppButtonWidget
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  constructor(commands: CommandRegistry, action: string) {
    this.commands = commands;
    this.action = action;
  }
  protected commands: CommandRegistry;
  protected action: string;

  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    const button = new CommandToolbarButton({
      commands: this.commands,
      id: this.action
    });
    panel.toolbar.insertAfter(INSERT_AFTER_WIDGET, this.action, button);
    return button;
  }
}

export default TinyAppButtonWidget;
