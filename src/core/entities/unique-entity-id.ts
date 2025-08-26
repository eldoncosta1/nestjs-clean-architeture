import { randomUUID } from 'node:crypto'

export class UniqueEntityID {
  private _value: string

  toString() {
    return this._value
  }

  toValue() {
    return this._value
  }

  constructor(value?: string) {
    this._value = value ?? randomUUID()
  }

  public equals(id: UniqueEntityID) {
    return id.toValue() == this._value
  }
}
