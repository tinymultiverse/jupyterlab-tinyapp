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
import LinearProgress from '@material-ui/core/LinearProgress';
import LaunchIcon from '@material-ui/icons/Launch';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import Moment from 'moment';

import { requestAPI } from '../middleware';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Typography
} from '@material-ui/core';
import { useStyles } from '../style/styles';
import { CopyButton } from '../components/CopyButton';
import { delay } from '../utils/common';

interface IAppCardProps {
  app: Record<string, any>
  handleLogsButtonClick: (appName: string, appId: string) => void
  handleDelete: (appId: string) => void
}
export const AppCard = (props: IAppCardProps): any => {
  const classes = useStyles();
  const {app, handleLogsButtonClick, handleDelete} = props;
  const [errorMessage, setErrorMessage] = useState('');
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  var isWaitCancelled = false;

  const maxWaitTime = 15 * 60 * 1000; // 15 minutes
  const pingInterval = 7 * 1000; // 7 seconds

  // Pings the app url
  const ping = async (url: string): Promise<boolean> => {
    return new Promise(resolve => {
      requestAPI<any>('ping', {
        body: JSON.stringify({
          url: url
        }),
        method: 'POST'
      })
        .then(result => result.data)
        .then(result => resolve(result.ok));
    });
  };

  const loadingTimeout = (t0: Date, maxMilliseconds: number): boolean => {
    const tn = new Date();
    const timeDeltaMilliseconds = tn.getTime() - t0.getTime();
    return timeDeltaMilliseconds > maxMilliseconds;
  };

  const waitForAppStart = async (appUrl: string) => {
    const t0 = new Date();
    let ok = false;

    while (true) {
      if (loadingTimeout(t0, maxWaitTime)) {
        console.log('max wait time reached');
        setErrorMessage('App is taking too long to start. Please check logs.');
        break;
      }

      if (isWaitCancelled) {
        console.log('wait is cancelled');
        break;
      }

      console.log('pinging: ' + ok.toString());
      ok = await ping(appUrl);
      console.log('ready: ' + ok.toString());
      if (ok === true) {
        break;
      }

      await delay(pingInterval);
    }

    setIsLoading(false)
    console.log('app is ready');
  }

  useEffect(() => {
    waitForAppStart(app.appRelease?.appUrl)

    return function cleanup() {
      isWaitCancelled = true
    }
  }, []);

  const handleDeleteButtonClick = async (): Promise<void> => {
    if (
      window.confirm(
        'Are you sure you want to delete this app? It cannot be undone.'
      )
    ) {
      setErrorMessage('');
      setDeleteErrorMessage('');
      setIsDeleting(true);

      try {
        await requestAPI<any>('delete_app', {
          body: JSON.stringify({
            appId: app.appRelease?.id
          }),
          method: 'POST'
        });
      } catch (error) {
        console.log('error deleting app:', error)
        setDeleteErrorMessage('Failed to delete app.')
        return
      } finally {
        setIsDeleting(false);
      }

      handleDelete(app.appRelease?.id);
    }
  };

  const actions = (
    <CardActions>
      <Button href={app.appRelease?.appUrl} target='_blank' disabled={isLoading || isDeleting || errorMessage != ''}>
        <LaunchIcon fontSize='small' />
        &nbsp;View
      </Button>
      <CopyButton disabled={isDeleting} copyText={app.appRelease?.appUrl} />
      <Button
        disabled={isDeleting}
        onClick={() =>
          handleLogsButtonClick(app.appDetail?.name, app.appRelease?.id)
        }
      >
        <MenuBookIcon fontSize='small' />
        &nbsp;Logs
      </Button>
      <Button
        disabled={isDeleting}
        onClick={async (): Promise<void> =>
          await handleDeleteButtonClick()
        }
      >
        <DeleteForeverIcon fontSize='small' />
        &nbsp;Delete
      </Button>
    </CardActions>
  );

  const title = app.appDetail?.name && (
    <Typography variant='h5' component='h2' style={{ paddingBottom: '10px' }}>
      {app.appDetail?.name}
    </Typography>
  );

  const creationTime = app.appRelease?.creationTimeStamp && (
    <span key={'Creation Time'} className={classes.valuePairContainer}>
      <Typography className={classes.valuePairLabel}>{'Creation Time'}&nbsp;</Typography>
      <Typography className={classes.valuePairValue}>{Moment(app.appRelease?.lastUpdateTimeStamp).format('lll')}</Typography>
  </span>
  )

  // TODO Show author once integrated with oauth or ldap
  // const author = (
  //   <span key={'author'} className={classes.valuePairContainer}>
  //     <Typography className={classes.valuePairLabel}>{'Author'}&nbsp;</Typography>
  //     <Typography className={classes.valuePairValue}>{app.appRelease?.appCreatorUserId}</Typography>
  //   </span>
  // );

  const description = app.appDetail?.description && (
    <Typography style={{ paddingTop: '20px' }} className={classes.valuePairValue} color='textPrimary'>{app.appDetail?.description}</Typography>
  );

  const progressBar = !errorMessage && (isLoading || isDeleting) && (
    <div style={{paddingTop: '20px'}}>
      <LinearProgress
        classes={{colorPrimary: classes.colorPrimary, barColorPrimary: classes.barColorPrimary}}
      />
    </div>
  );

  const error = (errorMessage || deleteErrorMessage) && (
    <Typography color='error' style={{paddingTop: '20px'}}>
      {errorMessage ? errorMessage : deleteErrorMessage}
    </Typography>
  );

  return (
    <Card className={classes.appCard} variant='outlined'>
      <CardContent>
        {title}
        {creationTime}
        {description}
        {progressBar}
        {error}
      </CardContent>
      {actions}
    </Card>
  );
}
