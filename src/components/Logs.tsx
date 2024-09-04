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

import React, { useEffect, useState } from 'react';
import { Button } from '@material-ui/core';
import Prism from "prismjs";
import { useStyles } from '../style/styles';
import { LoadingView, ResultContainer, ResultType, ViewType } from './Common';

import '../../style/base.css';
import 'prismjs/components/prism-log';

interface ILogsProps {
  appName: string
  shouldShowCloseButton: boolean
  fetchLogs: () => Promise<string>
  handleClose: () => void
}

export const LogsDisplay = (props: ILogsProps) => {
  const classes = useStyles();
  const { appName, shouldShowCloseButton, fetchLogs, handleClose } = props;
  const [logs, setLogs] = useState('')
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('')

  const handleFetchLogs = async () => {
    setError('')
    setIsLoading(true);
    
    try {
      const newLogs = await fetchLogs();
      setLogs(newLogs);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('failed to retrieve logs from server')
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (appName) {
      handleFetchLogs();
    }
  }, [appName, fetchLogs])

  useEffect(() => {
    Prism.highlightAll() // Trigger Prism.js syntax highlighting
  });

  const errorResult = error && (
    // App container may have not started yet - just say no logs available in all cases.
    <ResultContainer
      viewType={ViewType.MAIN}
      resultType={ResultType.SUCCESS}
      title={'There are no logs available'}
      message={'Refresh after some time'}
    />
  )

  const logsResult = !errorResult && !isLoading && (
    <div className='logs-container'>
      <div className='logs-content'>
        <pre className='logs-pre'>
          <code className="language-log">{logs}</code>
        </pre>
      </div>
      {
        shouldShowCloseButton && (
          <Button style={{'float': 'right'}} className={classes.primaryButton} variant='contained' size='small' onClick={handleClose}>
            Close
          </Button>
        )
      }
    </div>
  );

  return (
    <div className='logs'>
      <h2>Logs for {appName}</h2>
      <Button className={classes.secondaryButton} variant='contained' size='small' onClick={handleFetchLogs} disabled={isLoading}>
        Refresh
      </Button>
      {errorResult}
      {isLoading && <LoadingView viewType={ViewType.MAIN} />}
      {logsResult}
    </div>
  );
};