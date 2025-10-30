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
import { INotebookTracker, Notebook, NotebookActions, NotebookPanel } from '@jupyterlab/notebook';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { getPreviewNotebookPath } from './Preview';

// TODO: pull these out into a separate types file. should probably reorganize a little bit.
interface GenerateArgs {
	prompt: string;
	image?: string;
	intent: 'new' | 'modify';
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
				image: generateArgs.image,
				intent: generateArgs.intent,
		};
		socket.send(JSON.stringify(requestData))
	};

	var streamDestination = StreamDestination.DESCRIPTION;
	var cellsCleared = false; // Track if we've cleared cells yet
	
	socket.onmessage = async (event) => {
		// Clear cells on first message received (after backend validation passes)
		if (!cellsCleared) {
			const numCells = notebook.model?.sharedModel.cells.length
			if (numCells) {
				notebook.model?.sharedModel.deleteCellRange(0, numCells)
			}
			cellsCleared = true;
		}
		
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

	socket.onclose = (event) => {
		console.log("WebSocket connection closed", event);
		// Abnormal close
		if (event.code !== 1000 && event.reason) {
			const title = event.reason.includes("File must be empty") 
				? "Cannot create new app" 
				: "Failed to generate app";
			showErrorMessage(title, event.reason);
		}
	};

	socket.onerror = (error) => {
		console.error("WebSocket error:", error);
	};
};

export const generateAppExecutor = async (
  commands: CommandRegistry,
  tracker: INotebookTracker,
  docManager: IDocumentManager,
  shell: JupyterFrontEnd.IShell,
  args: GenerateArgs
): Promise<void> => {
	// Check if the preview widget is currently active
	const currentShellWidget = shell.currentWidget;
	const isPreviewActive = currentShellWidget && currentShellWidget.id === 'preview-widget';
	
	let notebookPath: string;
	let notebookWidget = tracker.currentWidget;

	if (isPreviewActive) {
		// If preview is active, use the notebook path associated with the preview
		notebookPath = getPreviewNotebookPath();
		
		if (!notebookPath) {
			showErrorMessage("Cannot edit app", "no notebook associated with preview")
			return
		}

		// Find the notebook widget for the stored path using tracker.find
		notebookWidget = tracker.find((widget: NotebookPanel) => widget.context.path === notebookPath) || null;

		// If the notebook is not open, open it
		if (!notebookWidget) {
			try {
				const docWidget = await docManager.openOrReveal(notebookPath);
				if (docWidget && 'content' in docWidget && docWidget.content instanceof Notebook) {
					notebookWidget = docWidget as any;
				}
			} catch (error) {
				showErrorMessage("failed to open notebook", `Could not open ${notebookPath}`);
				return;
			}
		}
	} else {
		// If preview is not active, use the current widget
		notebookPath = notebookWidget?.context.path || '';
	}

	if (!notebookWidget) {
		showErrorMessage("failed to generate app", "notebook must be opened & active")
		return
	}

	const notebook: Notebook = notebookWidget.content

	if (!notebookPath.endsWith('.ipynb')) {
		showErrorMessage("Selected file is not a notebook", "Please open a notebook file to generate an app")
		return
	}

	await GenerateApp(commands, notebook, notebookPath, args)
};
