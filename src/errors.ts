import type { Response } from 'node-fetch'

export class TimingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
    /* istanbul ignore else  */
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export class TimingRequestError extends TimingError {
  public url?: string
  public status?: number
  public statusText?: string

  constructor(message: string, response?: Response) {
    super(message)

    if (response) {
      this.url = response.url
      this.status = response.status
      this.statusText = response.statusText
    }
  }
}

export class TimingApiError extends TimingRequestError {
  constructor(message: string, response?: Response) {
    super(message)

    if (response) {
      this.url = response.url
      this.status = response.status
      this.statusText = response.statusText
    }
  }
}

export class TimingNotFoundError extends TimingApiError {
  constructor(message: string, response?: Response) {
    super(message, response)
  }
}
