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

import React, { ChangeEvent, useState } from 'react';

import { CommandRegistry } from '@lumino/commands';
import { CustomWidgetCommand } from '../utils/constants';
import Button from '@material-ui/core/Button';
import { useStyles } from '../style/styles';
import { TextField, ThemeProvider, Typography } from '@material-ui/core';
import { theme } from '../style/theme';
import { RxMagicWand } from "react-icons/rx";
import { EnvVars } from '../utils/common';

export interface ITinyAppPanelWidgetProps {
  commands: CommandRegistry;
  envVars: EnvVars;
}
export const TinyAppPanelWidget = (
  props: ITinyAppPanelWidgetProps
): any => {
  const classes = useStyles();

  const [promptTextInput, setPromptTextInput] = useState("")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const handlePromptInputChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
    setPromptTextInput(event.target.value);
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const imageFile = event.target.files?.[0];
  
    if (imageFile) {
        // Validate the file size (less than 20 MB)
        const maxSize = 20 * 1024 * 1024; // 20 MB in bytes
        if (imageFile.size > maxSize) {
            alert("File is too large. Please select a file less than 20 MB.");
            return;
        }
  
        // Validate the file format (PNG, JPEG, GIF, or WEBP)
        const validFormats = ["image/png", "image/jpeg", "image/gif", "image/webp"];
        if (!validFormats.includes(imageFile.type)) {
            alert("Unsupported file format. Please select a PNG, JPEG, GIF, or WEBP file.");
            return;
        }
  
        // File reading and Data URL conversion
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
            // Ensure the `result` is a string before calling `setUploadedImage`.
            if (typeof e.target?.result === 'string') {
                setUploadedImage(e.target.result);
            }
        };
        reader.onerror = (e) => {
            alert("Error reading file. Please try again.");
        };
        reader.readAsDataURL(imageFile);
    }
  };

  const { commands, envVars } = props;
  return (
    <div className={classes.panelWrapper}>
      <ThemeProvider theme={theme}>
        <Typography
          variant="h5"
          component="h3"
          align="center"
          color="textPrimary"
        >
          Tiny App
          <hr />
        </Typography>
      </ThemeProvider>

      {/* new app button */}
      <Button
        variant="contained"
        onClick={async (): Promise<void> => {
          await commands.execute(CustomWidgetCommand.NEW_APP);
        }}
        className={classes.panelButton}
      >
        <i className={'fas fa-plus'} />
        &nbsp;New App Directory
      </Button>

      {/* list apps button */}
      <Button
        variant="contained"
        onClick={async (): Promise<void> => {
          await commands.execute(CustomWidgetCommand.LIST_APPS);
        }}
        className={classes.panelButton}
      >
        <i className={'fas fa-user-alt'} />
        &nbsp;Published Apps
      </Button>


{/* 
  Flow can be 
  1. Create APP (instead of new app directory)
  2. second page is a dialog. First box is "name app". 2nd box is "Generate" (with text box) or "From Scratch" buttons 
  3. Generate or write from scratch box to click. 
*/}

{/* TODO: pull this all out into a component */}
{ envVars.ai_enabled? 
  <>     
      <Button
        variant="contained"
        onClick={async (): Promise<void> => {
          // pull this out as a func
          await commands.execute(CustomWidgetCommand.GENERATE_APP, { prompt: promptTextInput, image: uploadedImage });
        }}
        className={classes.panelButton}
      >       
        <RxMagicWand size={24}/>
        &nbsp;Generate App
      </Button>
      {/* Text Input Field */}
      <TextField
        // autoFocus={true} // TODO: remove this
        label="Write your prompt"
        variant="outlined"
        fullWidth
        value={promptTextInput}
        onChange={handlePromptInputChange}
        className={classes.generateInput}
        multiline
        rows={2}
        maxRows={4}
      />

      <div className={`${classes.fileUploadContainer} ${classes.mt1}`}>
        <label htmlFor="file-upload" className={classes.mb1}>
          Mock Design
        </label>
        <input id="file-upload" type="file" accept="image/*" onChange={handleImageChange}/>
        
        {uploadedImage && (
          <div className={`${classes.mt1}`}>
            <img src={uploadedImage} alt="Uploaded" style={{ width: '50px', height: '50px' }} />
          </div>
        )}
      </div>
      </> : <></>
      }
    </div>
  );
};
