import {
  MissingParamError,
  InvalidParamError,
  AddAccount,
  AccountModel, AddAccountModel
} from './signup-protocols'
import { SignUpController } from './signup-controller'
import { EmailValidator } from '../../protocols/email-validator'
import { serverError } from '../../helpers/http-helper'

const makeEmailValidator = (): EmailValidator => {
  class EmailValidatorStub implements EmailValidator {
    isValid (email: string): boolean {
      return true
    }
  }
  return new EmailValidatorStub()
}

const makeAddAccount = (): AddAccount => {
  class AddAccountStub implements AddAccount {
    async addAccount (account: AddAccountModel): Promise<AccountModel> {
      const fakeAccount = {
        id: 'any_id',
        name: 'any_name',
        email: 'any_email@mail.com',
        password: 'any_password'
      }
      return new Promise(resolve => resolve(fakeAccount))
    }
  }
  return new AddAccountStub()
}

interface SutTypes {
  addAccountStub: AddAccount
  emailValidatorStub: EmailValidator
  sut: SignUpController
}

const makeSut = (): SutTypes => {
  const addAccountStub = makeAddAccount()
  const emailValidatorStub = makeEmailValidator()
  const sut = new SignUpController(emailValidatorStub, addAccountStub)
  return { sut, emailValidatorStub, addAccountStub }
}

describe('SignUpController', () => {
  test('should return 400 if no name is provided', async () => {
    const { sut } = makeSut()
    const httpResponse = await sut.handle({
      body: {
        email: 'any_email@mail.com',
        password: 'any_password',
        passwordConfirmation: 'any_password'
      }
    })
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new MissingParamError('name'))
  })

  test('should return 400 if no email is provided', async () => {
    const { sut } = makeSut()
    const httpResponse = await sut.handle({
      body: {
        name: 'any_name',
        password: 'any_password',
        passwordConfirmation: 'any_password'
      }
    })
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new MissingParamError('email'))
  })

  test('should return 400 if no password is provided', async () => {
    const { sut } = makeSut()
    const httpResponse = await sut.handle({
      body: {
        name: 'any_name',
        email: 'any_email@mail.com',
        passwordConfirmation: 'any_password'
      }
    })
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new MissingParamError('password'))
  })

  test('should return 400 if no passwordConfirmation is provided', async () => {
    const { sut } = makeSut()
    const httpResponse = await sut.handle({
      body: {
        name: 'any_name',
        email: 'any_email@mail.com',
        password: 'any_password'
      }
    })
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new MissingParamError('passwordConfirmation'))
  })

  test('should return 400 if password confirmation fails', async () => {
    const { sut } = makeSut()
    const httpResponse = await sut.handle({
      body: {
        name: 'any_name',
        email: 'any_email@mail.com',
        password: 'any_password',
        passwordConfirmation: 'other_password'
      }
    })
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new InvalidParamError('password confirmation fails'))
  })

  test('should return 400 if invalid email is provided', async () => {
    const { sut, emailValidatorStub } = makeSut()
    jest.spyOn(emailValidatorStub, 'isValid').mockReturnValueOnce(false)
    const httpResponse = await sut.handle({
      body: {
        name: 'any_name',
        email: 'invalid_email@mail.com',
        password: 'any_password',
        passwordConfirmation: 'any_password'
      }
    })
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new InvalidParamError('email'))
  })

  test('should call EmailValidator with correct email', async () => {
    const { sut, emailValidatorStub } = makeSut()
    const emailValidatorSPy = jest.spyOn(emailValidatorStub, 'isValid')
    await sut.handle({
      body: {
        name: 'any_name',
        email: 'any_email@mail.com',
        password: 'any_password',
        passwordConfirmation: 'any_password'
      }
    })
    expect(emailValidatorSPy).toHaveBeenCalledWith('any_email@mail.com')
  })

  test('should return 500 if EmailValidator throws', async () => {
    const { sut, emailValidatorStub } = makeSut()
    jest.spyOn(emailValidatorStub, 'isValid').mockImplementationOnce(() => {
      throw new Error()
    })
    const httpResponse = await sut.handle({
      body: {
        name: 'any_name',
        email: 'any_email@mail.com',
        password: 'any_password',
        passwordConfirmation: 'any_password'
      }
    })
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse).toEqual(serverError(new Error()))
  })

  test('should call AddAccount with correct values', async () => {
    const { sut, addAccountStub } = makeSut()
    const addAccountSpy = jest.spyOn(addAccountStub, 'addAccount')
    await sut.handle({
      body: {
        name: 'valid_name',
        email: 'valid_email@mail.com',
        password: 'valid_password',
        passwordConfirmation: 'valid_password'
      }
    })
    expect(addAccountSpy).toHaveBeenCalledWith({
      name: 'valid_name',
      email: 'valid_email@mail.com',
      password: 'valid_password'
    })
  })

  test('should return 500 if AddAccount throws', async () => {
    const { sut, addAccountStub } = makeSut()
    jest.spyOn(addAccountStub, 'addAccount').mockImplementation(async () => {
      return new Promise((resolve, reject) => reject(new Error()))
    })
    const httpResponse = await sut.handle({
      body: {
        name: 'valid_name',
        email: 'valid_email@mail.com',
        password: 'valid_password',
        passwordConfirmation: 'valid_password'
      }
    })
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse).toEqual(serverError(new Error()))
  })

  test('should returns 200 if AddAccount success', async () => {
    const { sut } = makeSut()
    const httpResponse = await sut.handle({
      body: {
        name: 'valid_name',
        email: 'valid_email@mail.com',
        password: 'valid_password',
        passwordConfirmation: 'valid_password'
      }
    })
    expect(httpResponse.statusCode).toBe(200)
    expect(httpResponse.body).toEqual({
      id: 'any_id',
      name: 'any_name',
      email: 'any_email@mail.com',
      password: 'any_password'
    })
  })
})
