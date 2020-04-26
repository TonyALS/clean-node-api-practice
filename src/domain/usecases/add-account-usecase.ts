import { AccountModel } from '../models/account-model'

export interface AddAccountModel {
  name: string
  email: string
  password: string
}

export interface AddAccount {
  addAccount (account: AddAccountModel): AccountModel
}
