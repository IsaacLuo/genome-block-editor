class CtxError extends Error {
  public status: number;
  public expose: boolean;
  constructor(status:number, message?: string) {
      super(message);
      this.status = status;
      this.expose = true;
      // Set the prototype explicitly.
      // Object.setPrototypeOf(this, CtxError.prototype);
  }
}
const ctxThrow = (status:number, message?:string)=> {
  const err = new CtxError(status, message);
  throw err;
}

export default ctxThrow;