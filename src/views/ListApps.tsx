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

import React, { useEffect, useState, useRef } from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { ReactWidget } from '@jupyterlab/apputils';
import { Button } from '@material-ui/core';

import { requestAPI } from '../middleware';
import { useStyles } from '../style/styles';
import { LoadingView, ResultContainer, ResultType, ViewType } from '../components/Common';
import { LogsDisplay } from '../components/Logs';
import { AppCard } from '../components/AppCard'

export const listAppsExecutor = async (
  shell: JupyterFrontEnd.IShell
): Promise<void> => {
  const fetchApps = async (): Promise<any[]> => {
    const result = await requestAPI<any>('list_apps', {method: 'GET'})
    return result.data.apps
  };

  const widget = ReactWidget.create(<AppsDisplay fetchApps={fetchApps} />);
  widget.id = 'list-apps-widget';
  widget.title.iconClass = 'app-icon fas fa-user-alt';
  widget.title.label = 'Published Apps';
  widget.title.closable = true;
  shell.add(widget);
};

interface IAppsDisplayProps {
  fetchApps: () => Promise<any[]>;
}
const AppsDisplay = (props: IAppsDisplayProps): any => {
  const classes = useStyles();
  const { fetchApps } = props;
  const [appsList, setAppsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('')
  const [logsIsOpen, setLogsIsOpen] = useState(false);
  const [selectedAppName, setSelectedAppName] = useState('');
  const [selectedAppId, setSelectedAppId] = useState('');

  const listedAppsRef = useRef<HTMLDivElement | null>(null);
  const logsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Function to handle clicks outside the component
    const handleClickOutside = (event: { target: any; button: number }) => {
      if (
        logsIsOpen &&
        event.button === 0 &&
        listedAppsRef.current && listedAppsRef.current.contains(event.target) &&
        logsRef.current && !logsRef.current.contains(event.target)
      ) {
        setLogsIsOpen(false);
      }
    };

    if (logsIsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup the event listener when the component unmounts
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [logsIsOpen]);
  
  const handleFetchApps = async () => {
    setError('')
    setIsLoading(true);
    
    try {
      const newAppsList = await fetchApps();
      setAppsList(newAppsList);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError('failed to retrieve apps from server')
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    handleFetchApps();
  }, [fetchApps]);

  const handleDelete = (
    appId: string,
  ) => {
    const updatedAppsList = appsList.filter((app) => app.appRelease?.id !== appId);
    setAppsList(updatedAppsList);
  };

  const handleLogsButtonClick = (appName: string, appId: string) => {
    setSelectedAppName(appName)
    setSelectedAppId(appId)
    setLogsIsOpen(true)
  };

  const refreshButton = !isLoading && !error && (
    <Button className={classes.secondaryButton} variant='contained' size='small' onClick={handleFetchApps} disabled={isLoading}>
      Refresh
    </Button>
  )

  const cardsList = appsList.map((app: Record<string, any>) => {
    return (
      <AppCard key={app.appRelease?.id} app={app} handleLogsButtonClick={handleLogsButtonClick} handleDelete={handleDelete} />
    );
  });

  const cards = !isLoading && !error && (
    appsList.length > 0 ? cardsList : (
      <ResultContainer
        viewType={ViewType.MAIN}
        resultType={ResultType.SUCCESS}
        title={"You don't have any apps yet"}
        message={
          'You can publish an app from a notebook within an app directory'
        }
      />
    )
  );

  const fetchLogs = async (): Promise<string> => {
    const result = await requestAPI<any>('logs?app_name=' + selectedAppId, {method: 'GET'})
    return result.data.logs
  };

  const logs = (
    <div className={`right-side-component ${logsIsOpen ? 'open' : ''}`} ref={logsRef}>
      <LogsDisplay appName={selectedAppName} shouldShowCloseButton={true} fetchLogs={fetchLogs} handleClose={() => setLogsIsOpen(false)}/>
    </div>
  )

  const loadingView = isLoading && <LoadingView viewType={ViewType.MAIN}/>

  const errorResult = error && (
    <ResultContainer
      viewType={ViewType.MAIN}
      resultType={ResultType.ERROR}
      title={'Unable to load apps'}
      message={'Internal error occured'} // Don't show system-level error to users
    />
  )

  return (
    <div ref={listedAppsRef}>
      <div className='apps'>
        <div>
          {refreshButton}
        </div>
        <div className='cards-container'>
          <div className='cards-container2'>
            <div className={classes.listedAppsWrapper}>
              {cards}
            </div>
          </div>
        </div>
        {errorResult}
        {loadingView}
        {logs}
      </div>
    </div>
  );
};
