import 'should'
import {model, str, num, maybe} from '../../src'
import {timeout} from '../utils'


describe('extend', () => {
  it('should work', () => {
    class MBaseUser {
      @str login
      @str password
    }
    const BaseUser = model(MBaseUser)

    class MUser extends BaseUser {
      @str firstName
    }
    const User = model(MUser)

    const user = User.create({
      login: 'user',
      password: '1234',
      firstName: 'Name',
    })

    user.should.have.property('login').which.is.equal('user')
    user.should.have.property('password').which.is.equal('1234')
    user.should.have.property('firstName').which.is.equal('Name')
  })

  it('overriding props', () => {
    class MBaseUser {
      @str login
    }
    const BaseUser = model(MBaseUser)

    class MUser extends BaseUser {
      @num login
    }
    const User = model(MUser)

    const user = User.create({
      login: 1,
    })

    user.should.have.property('login').which.is.equal(1)
  })

  it('overriding action', () => {
    class MBaseUser {
      @maybe(str) login

      setLogin(login) {
        this.login = login
      }
    }
    const BaseUser = model(MBaseUser)

    class MUser extends BaseUser {
      setLogin(login) {
        this.login = login + '1'
      }
    }
    const User = model(MUser)

    const user = User.create()
    user.setLogin('user')

    user.should.have.property('login').which.is.equal('user1')
  })

  it('overriding flow', async () => {
    class MBaseUser {
      @maybe(str) login

      *setLogin(login) {
        yield timeout(1)
        this.login = login
      }
    }
    const BaseUser = model(MBaseUser)

    class MUser extends BaseUser {
      *setLogin(login) {
        yield timeout(1)
        this.login = login + '1'
      }
    }
    const User = model(MUser)

    const user = User.create()
    await user.setLogin('user')

    user.should.have.property('login').which.is.equal('user1')
  })
})
