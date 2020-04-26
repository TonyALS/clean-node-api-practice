import {
  HttpRequest,
  HttpResponse,
  Controller,
  MissingParamError,
  InvalidParamError,
  AddAccount
} from './signup-protocols'
import { badRequest, serverError, success } from '../../helpers/http-helper'
import { EmailValidator } from '../../protocols/email-validator'

export class SignUpController implements Controller {
  private readonly emailValidator: EmailValidator
  private readonly addAccount: AddAccount

  constructor (emailValidator: EmailValidator, addAccount: AddAccount) {
    this.emailValidator = emailValidator
    this.addAccount = addAccount
  }

  async handle (httpRequest: HttpRequest): Promise<HttpResponse> {
    try {
      const requiredFields = ['name', 'email', 'password', 'passwordConfirmation']
      for (const field of requiredFields) {
        if (!httpRequest.body[field]) {
          return badRequest(new MissingParamError(field))
        }
      }
      const { name, email, password, passwordConfirmation } = httpRequest.body
      if (password !== passwordConfirmation) {
        return badRequest(new InvalidParamError('password confirmation fails'))
      }
      const isValid = this.emailValidator.isValid(email)
      if (!isValid) {
        return badRequest(new InvalidParamError('email'))
      }
      const account = await this.addAccount.addAccount({ name, email, password })
      return success(account)
    } catch (error) {
      return serverError()
    }
  }
}
