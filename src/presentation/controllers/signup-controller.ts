import { HttpRequest, HttpResponse } from '../protocols/http'
import { badRequest } from '../helpers/http-helper'

export class SignUpController {
  handle (httpRequest: HttpRequest): HttpResponse {
    if (!httpRequest.body.name) {
      return badRequest(new Error('name'))
    }
    if (!httpRequest.body.email) {
      return badRequest(new Error('email'))
    }
  }
}
