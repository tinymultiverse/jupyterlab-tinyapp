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

export const getSelectedAppType = (id: string): string => {
  const currentWidget = document.getElementById(id);
  var selectorDiv;
  var selector;
  if (currentWidget != null) {
    selectorDiv = currentWidget.getElementsByClassName(
      'app-type-selector'
    )[0];
    selector = selectorDiv.getElementsByTagName('select')[0];
    return selector.options[selector.selectedIndex].value;
  } else {
    return "";
  }
};

export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

export const makeRandomStr = (len: number): string => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < len) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export interface EnvVars {
  ai_enabled: boolean;
}