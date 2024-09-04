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

import { makeStyles } from '@material-ui/styles';
import { createStyles } from '@material-ui/core';
import { theme } from './theme';

export const useStyles = makeStyles(() =>
  createStyles({
    formContainer: {
      padding: '5%'
    },
    panelWrapper: {
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflowY: 'auto',
      backgroundColor: 'white',
      alignItems: 'center'
    },
    appCard: {
      marginBottom: '30px',
      borderWidth: '2px'
    },
    listedAppsWrapper: {
      marginBottom: '30px',
      backgroundColor: 'white',
    },
    panelButton: {
      color: 'white !important',
      backgroundColor: 'rgb(0, 0, 243) !important',
      marginTop: '20px !important',
      padding: '15px !important',
      width: '100%',
    },
    generateInput: {
      // color: 'white !important',
      // backgroundColor: 'rgb(0, 0, 243) !important',
      marginTop: '20px !important',
      padding: '15px !important',
      width: '100%',
      // This is to keep the label from touching the left edge (prior to user input)
      '& .MuiInputLabel-outlined': {
        // Targeting the label of an outlined TextField
        marginLeft: theme.spacing(1), // Adjust the value as needed
        // Ensure this margin applies only when the label is shrunken
        '&.MuiInputLabel-shrink': {
          marginLeft: theme.spacing(1),
        },
      },
    },
    fileUploadContainer: {
      // padding: '15px !important',
      textAlign: 'left',
      marginLeft: '50px !important',
      '& label': {
        display: 'block',
        // marginBottom: theme.spacing(3), // or use a fixed value like '5px'
      },
      '& input': {
        // Add any specific styles for your file input here if needed
      },
    },
  
    mt3: {
      marginTop: theme.spacing(3), // Assuming mt-3 stands for margin-top: 3
    },
    mt1: {
      marginTop: theme.spacing(1),
    },
    mb3: {
      marginBottom: theme.spacing(3), // Assuming mt-3 stands for margin-top: 3
    },
    mb1: {
      marginBottom: theme.spacing(1),
    },
    mainView: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      top: '40%'
    },
    partialView: {
      marginTop: '10%'
    },
    successContainer: {
      textAlign: 'center',
      fontSize: '30px',
      color: theme.palette.text.primary
    },
    errorContainer: {
      textAlign: 'center',
      fontSize: '30px',
      color: 'rgb(189, 61, 61)'
    },
    valuePairContainer: {
      display: 'flex'
    },
    valuePairLabel: {
      color: 'rgb(109, 117, 129)',
    },
    valuePairValue: {
      color: 'rgb(27, 29, 32)',
    },
    primaryButton: {
      color: 'white !important',
      backgroundColor: 'rgb(0, 0, 243) !important',
    },
    secondaryButton: {
      color: 'rgb(0, 0, 243) !important',
      backgroundColor: 'white !important',
      border: '1px solid rgb(0, 0, 243)'
    },
    colorPrimary: {
      color: 'rgb(0, 0, 243)',
      backgroundColor: 'rgb(0, 0, 243)',
    },
    barColorPrimary: {
      color: 'rgb(219, 221, 225)',
      backgroundColor: 'rgb(219, 221, 225)'
    }
  })
);
