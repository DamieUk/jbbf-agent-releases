declare module 'global-shapes' {
  export interface IAnyShape {
    [field: string]: any;
  }

  export interface ISession {
    accessToken: string;
    refreshToken: string;
    expiresIn: number
  }
}
