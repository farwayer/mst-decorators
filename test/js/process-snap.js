import {getSnapshot} from 'mobx-state-tree'
import {model, str} from '../../src'


describe('processSnap', () => {
  it('work', () => {
    @model class BaseUser {
      @str login

      static preProcessSnapshot(snap) {
        return {
          login: snap.login + '-xxx',
        }
      }

      static postProcessSnapshot(snap) {
        return {
          login: snap.login.replace('-xxx', ''),
        }
      }
    }

    const user = BaseUser.create({
      login: 'login',
    })
    const snap = getSnapshot(user)

    user.should.have.property('login').which.is.equal('login-xxx')
    snap.should.have.property('login').which.is.equal('login')
  })

  it('extending', () => {
    @model class BaseUser {
      @str login

      static preProcessSnapshot(snap) {
        return {
          ...snap,
          login: snap.login + '-xxx',
        }
      }
    }

    @model class User extends BaseUser {
      @str firstName

      static preProcessSnapshot(snap) {
        return {
          ...snap,
          firstName: snap.firstName + '-xxx',
        }
      }
    }

    const user = User.create({
      login: 'login',
      firstName: 'firstName',
    })

    user.should.have.property('login').which.is.equal('login-xxx')
    user.should.have.property('firstName').which.is.equal('firstName-xxx')
  })
})
