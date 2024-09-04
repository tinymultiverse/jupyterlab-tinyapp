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

import { URLExt } from '@jupyterlab/coreutils';

import { ServerConnection } from '@jupyterlab/services';

const API_NAMESPACE = 'tinyapp';

export function createWebSocket(): WebSocket {
  const settings = ServerConnection.makeSettings();
  const requestUrl = URLExt.join(
    settings.baseUrl,
    API_NAMESPACE,
    'generate_app'
  );

  const wsUrl = requestUrl.replace('http', 'ws')

  return new WebSocket(wsUrl);
}

/**
 * Call the API extension
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @returns The response body interpreted as JSON
 */
export async function requestAPI<T>(
  endPoint = '',
  init: RequestInit = {},
  timeout=600000
): Promise<T> {
  // Make request to Jupyter API
  const settings = ServerConnection.makeSettings();
  const requestUrl = URLExt.join(
    settings.baseUrl,
    API_NAMESPACE,
    endPoint
  );

  let response: Response;
  try {
    response = await asyncCallWithTimeout(ServerConnection.makeRequest(requestUrl, init, settings), timeout);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ServerConnection.NetworkError(error);
    } else if (error instanceof Error) {
      throw new Error('error making request: ' + error.message)
    } else {
      throw new Error('error making request: ' +  JSON.stringify(error))
    }
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(response.status + ': ' + data.message)
  }

  return data;
}

/**
 * Call an async function with a maximum time limit (in milliseconds) for the timeout
 * @param asyncPromise An asynchronous promise to resolve
 * @param timeLimit Time limit to attempt function in milliseconds
 * @returns Resolved promise for async function call, or an error if time limit reached
 */
const asyncCallWithTimeout = async (asyncPromise: Promise<any>, timeLimit: number): Promise<any> => {
  let timeoutHandle: any;

  const timeoutPromise = new Promise((_resolve, reject) => {
      timeoutHandle = setTimeout(
          () => reject(new Error('async call timeout limit reached')),
          timeLimit
      );
  });

  return Promise.race([asyncPromise, timeoutPromise]).then(result => {
      clearTimeout(timeoutHandle);
      return result;
  })
}
