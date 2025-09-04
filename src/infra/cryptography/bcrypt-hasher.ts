import {
  HashGenerator,
  HashComparer,
} from '@/domain/forum/application/cryptography'
import { hash, compare } from 'bcryptjs'
import { Injectable } from '@nestjs/common'

@Injectable()
export class BcryptHasher implements HashGenerator, HashComparer {
  private HASH_SALT_ROUNDS = 8

  async hash(plain: string): Promise<string> {
    return hash(plain, this.HASH_SALT_ROUNDS)
  }

  async compare(plain: string, hashed: string): Promise<boolean> {
    return compare(plain, hashed)
  }
}
