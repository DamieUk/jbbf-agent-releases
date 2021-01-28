declare module 'global-shapes' {
  export interface IAnyShape {
    [field: string]: any;
  }

  export type IAnyFunc = (...args: any) => any;

  export interface ISession {
    accessToken: string;
    refreshToken: string;
    expiresIn: number
  }
}
