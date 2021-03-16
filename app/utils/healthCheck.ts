import axios from 'axios';
import { from, of, Subject } from 'rxjs';
import { delay, mergeMap, repeat, takeUntil, tap } from 'rxjs/operators';
import logger from './logger';

export class ServerHealthCheckService {
  async checkIsServerAvailable(href: string): Promise<boolean> {
    return axios
      .get(href)
      .then(() => true)
      .catch((e) => {
        if (e) {
          console.log(e);
        }
        return false;
      });
  }

  async waitUntilServerReady(
    href: string,
    intervalValue = 3000,
    attempts = 100
  ): Promise<void> {
    /* Polling server until it will be ready or reached max attempts number */
    const stopPolling$ = new Subject();
    let currentAttempt = 0;
    let currentValue: any;

    return of({})
      .pipe(
        mergeMap(() => from(this.checkIsServerAvailable(href))),
        tap((isReady) => {
          logger.info('Attempt ' + currentAttempt + ' isReady ' + isReady);
          currentValue = isReady;
          currentAttempt++;
          if (isReady) {
            stopPolling$.next(true);
          }
          if (currentAttempt === attempts) {
            throw new Error(
              'Error: server health check polling attempts has reached'
            );
          }
        }),
        delay(intervalValue),
        repeat(),
        takeUntil(stopPolling$)
      )
      .toPromise()
      .then(() => currentValue);
  }
}
