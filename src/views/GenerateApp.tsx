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

import { showErrorMessage } from '@jupyterlab/apputils';
import { CommandRegistry } from '@lumino/commands';
import {
  IDocumentManager,
} from '@jupyterlab/docmanager';

import { createWebSocket } from '../middleware';
import { INotebookTracker, Notebook, NotebookActions } from '@jupyterlab/notebook';

// TODO: pull these out into a separate types file. should probably reorganize a little bit.
interface GenerateArgs {
	prompt: string;
	image?: string;
}

enum StreamDestination {
	DESCRIPTION = "description",
	CODE = "code",
	REQUIREMENTS = "requirements",
	UNDEFINED = "undefined"
}

enum StreamToken {
	DESCRIPTION_START = "<<desc>>",
	DESCRIPTION_END = "<</desc>>",
	CODE_START = "<<code>>",
	CODE_END = "<</code>>",
	UNDEFINED = "undefined"
}

const GenerateApp = async (commands: CommandRegistry, notebook: Notebook, notebookPath: string, generateArgs: GenerateArgs): Promise<void> => {
  	console.log("generating an app!")

	console.log("notebook panel is not null")
	// const notebook: Notebook = notebookPanel.content;
	
	const socket = createWebSocket()

	socket.onopen = async () => {
		console.log("WebSocket connection established");
		const requestData = {
			notebookPath: notebookPath,
			prompt: generateArgs.prompt,
			image: generateArgs.image
		};
		// Clear cells in notebook
		const numCells = notebook.model?.sharedModel.cells.length
		if (numCells) {
			notebook.model?.sharedModel.deleteCellRange(0, numCells)
		}

		socket.send(JSON.stringify(requestData))
	};

	var streamDestination = StreamDestination.DESCRIPTION;
	socket.onmessage = async (event) => {
		switch (event.data) {
			case StreamToken.DESCRIPTION_START:
				streamDestination = StreamDestination.DESCRIPTION;
				const newIndex = notebook.activeCell ? notebook.activeCellIndex : 0;
				if (!notebook.model) {
					return;
				}
				notebook.model.sharedModel.insertCell(newIndex, {
					cell_type: 'markdown',
					source: "# App Description \n",
					metadata: notebook.notebookConfig.defaultCell === 'code'
						? {
							// This is an empty cell created by user, thus is trusted
							trusted: true
							}
						: {}
				});
				notebook.activeCellIndex = newIndex;
				break;

			case StreamToken.DESCRIPTION_END:
				console.log("found end of description. Stream destination is now none")
				// strip whitespace from active cell
				if (notebook.activeCell) { notebook.activeCell.model.sharedModel.setSource(notebook.activeCell.model.sharedModel.getSource().trim())}
				streamDestination = StreamDestination.UNDEFINED;
				break;
			case StreamToken.CODE_START:
				streamDestination = StreamDestination.CODE;
				console.log("add and activate code cell")
				NotebookActions.insertBelow(notebook);
				break;

			case StreamToken.CODE_END:
				console.log("found end of code. Stream destination is now none")
				streamDestination = StreamDestination.UNDEFINED;
				// strip whitespace from active cell
				if (notebook.activeCell) {
					notebook.activeCell.model.sharedModel.setSource(notebook.activeCell.model.sharedModel.getSource().replace(/^\s+|\s+$/g, '')); //.trim());
				}

				await commands.execute('docmanager:save')
				socket.close()
				break;
				
			// TODO: we could have a <<deps>> case here but we're handling it in python for now
			
			default:
				console.log("writing to cell: ", streamDestination)
				// TODO: consider when to access cell via notebook and notebook panel above
				if (notebook.activeCell) {
					notebook.activeCell.model.sharedModel.setSource(notebook.activeCell.model.sharedModel.getSource() + event.data);
				}
		};
	}

	socket.onclose = () => {
		console.log("WebSocket connection closed");
	};

	socket.onerror = (error) => {
		console.error("WebSocket error:", error);
	};
};

export const generateAppExecutor = async (
  commands: CommandRegistry,
  tracker: INotebookTracker,
  docManager: IDocumentManager,
  args: GenerateArgs
): Promise<void> => {
	const currentWidget = tracker.currentWidget

	if (!currentWidget) {
		showErrorMessage("failed to generate app", "notebook must be opened & active")
		return
	}

	const notebook: Notebook = currentWidget.content
	const notebookPath = currentWidget.context.path

	if (!notebookPath.endsWith('.ipynb')) {
		showErrorMessage("Selected file is not a notebook", "Please open a notebook file to generate an app")
		return
	}

	await GenerateApp(commands, notebook, notebookPath, args)
};
