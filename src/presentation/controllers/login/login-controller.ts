import { Controller, HttpResponse, HttpRequest, EmailValidator, Authentication } from './login-protocols'
import { badRequest, serverError, unauthorized, success } from '../../helpers/http-helper'
import { MissingParamError, InvalidParamError } from '../../errors'

export class LoginController implements Controller {
  constructor (
    private readonly emailValidator: EmailValidator,
    private readonly authentication: Authentication
  ) {}

  async handle (httpRequest: HttpRequest): Promise<HttpResponse> {
    try {
      const requiredFields = ['email', 'password']
      for (const field of requiredFields) {
        if (!httpRequest.body[field]) {
          return new Promise(resolve => resolve(badRequest(new MissingParamError(field))))
        }
      }
      const { email, password } = httpRequest.body
      const isValid = this.emailValidator.isValid(email)
      if (!isValid) {
        return badRequest(new InvalidParamError('email'))
      }
      const accessToken = await this.authentication.auth(email, password)
      if (!accessToken) {
        return unauthorized()
      }
      return success({ accessToken })
    } catch (error) {
      return serverError(error)
    }
  }
}
