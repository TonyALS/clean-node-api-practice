import { LoginController } from './login'
import { MissingParamError } from '../../errors'
import { badRequest } from '../../helpers/http-helper'

interface SutTypes {
  sut: LoginController
}
const makeSut = (): SutTypes => {
  const sut = new LoginController()
  return { sut }
}

describe('LoginController', () => {
  test('should return 400 if no email is provided', async () => {
    const { sut } = makeSut()
    const httpRequest = {
      body: {
        password: 'any_password'
      }
    }
    const httpResponse = await sut.handle(httpRequest)
    expect(httpResponse).toEqual(badRequest(new MissingParamError('email')))
  })
})