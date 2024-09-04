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
import { Button, Tooltip } from '@material-ui/core';
import copy from 'clipboard-copy';
import FileCopyIcon from '@material-ui/icons/FileCopy';

export interface ICopyButtonProps {
  copyText: string;
  disabled: boolean;
}

export const CopyButton = (props: ICopyButtonProps): React.ReactElement => {
  const { copyText, disabled } = props;
  const [open, setOpen] = React.useState(false);

  const handleOpen = async (): Promise<void> => {
    setOpen(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setOpen(false);
  };

  return (
    <Tooltip
      open={open}
      onOpen={handleOpen}
      disableFocusListener
      disableHoverListener
      disableTouchListener
      title="Copied!"
    >
      <Button
        disabled={disabled}
        onClick={(): void => {
          copy(copyText);
          handleOpen();
        }}
      >
        <FileCopyIcon fontSize="small" />
        &nbsp;Copy Link
      </Button>
    </Tooltip>
  );
};
