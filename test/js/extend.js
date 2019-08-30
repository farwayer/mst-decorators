import {model, str, num, maybe} from '../../src'
import {timeout} from './utils'


describe('extend', () => {
  it('should work', () => {
    @model class BaseUser {
      @str login
      @str password
    }

    @model class User extends BaseUser {
      @str firstName
    }

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
    @model class BaseUser {
      @str login
    }

    @model class User extends BaseUser {
      @num login
    }

    const user = User.create({
      login: 1,
    })

    user.should.have.property('login').which.is.equal(1)
  })

  it('overriding action', () => {
    @model class BaseUser {
      @maybe(str) login

      setLogin(login) {
        this.login = login
      }
    }

    @model class User extends BaseUser {
      setLogin(login) {
        this.login = login + '1'
      }
    }

    const user = User.create()
    user.setLogin('user')

    user.should.have.property('login').which.is.equal('user1')
  })

  it('overriding flow', async () => {
    @model class BaseUser {
      @maybe(str) login

      *setLogin(login) {
        yield timeout(1)
        this.login = login
      }
    }

    @model class User extends BaseUser {
      *setLogin(login) {
        yield timeout(1)
        this.login = login + '1'
      }
    }

    const user = User.create()
    await user.setLogin('user')

    user.should.have.property('login').which.is.equal('user1')
  })
})
