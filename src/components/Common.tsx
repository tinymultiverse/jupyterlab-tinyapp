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
import { Spinner } from '@jupyterlab/apputils';
import { styled, TextField, Typography } from '@material-ui/core';
import { theme } from '../style/theme';
import { useStyles } from '../style/styles';

export const enum ResultType {
  NULL,
  SUCCESS,
  ERROR
}

// Changes how the margins are rendered on the page
export const enum ViewType {
  PARTIAL,
  MAIN
}

export const StyledTextInputField = styled(TextField)({
  paddingBottom: '20px',
  '& .MuiInput-underline:after': {
    borderBottom: `1px solid ${theme.palette.primary.main}`,
    transition: 'none'
  },
  '& .MuiInput-underline:hover:before': {
    borderBottom: '1px solid rgba(0, 0, 0, 0.42)'
  }
});

export const IframeContainer = (props: any): any => {
  return (
    <iframe
      style={{ height: '100%', width: '100%' }}
      src={props.url}
      title={props.title}
    />
  );
};

export interface ILoadingViewProps {
  viewType: ViewType;
}

export const LoadingView = (props: ILoadingViewProps): any => {
  const classes = useStyles();
  const { viewType } = props;
  const spinner = new Spinner();
  return (
    <div
      className={
        viewType === ViewType.MAIN ? classes.mainView : classes.partialView
      }
    >
      <div
        className="loading-spinner"
        dangerouslySetInnerHTML={{ __html: spinner.node.innerHTML }}
      />
    </div>
  );
};

export interface IResultContainerProps {
  viewType: ViewType;
  resultType: ResultType;
  title: string;
  message: string;
}

export const ResultContainer = (props: IResultContainerProps): any => {
  const classes = useStyles();
  const { viewType, resultType, title, message } = props;

  const containerClass =
    resultType === ResultType.SUCCESS
      ? classes.successContainer
      : classes.errorContainer;

  const viewClass =
    viewType === ViewType.MAIN ? classes.mainView : classes.partialView;

  return (
    <div className={`${containerClass} ${viewClass}`}>
      <Typography component="h5" variant="h5">
        {title}
      </Typography>
      <Typography component="h6" variant="h6">
        {message}
      </Typography>
    </div>
  );
};
