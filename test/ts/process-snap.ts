import {getSnapshot} from 'mobx-state-tree'
import {model, str} from '../../src'


describe('processSnap', () => {
  it('work', () => {
    class MBaseUser {
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
    const BaseUser = model(MBaseUser)

    const user = BaseUser.create({
      login: 'login',
    })
    const snap = getSnapshot(user)

    user.should.have.property('login').which.is.equal('login-xxx')
    snap.should.have.property('login').which.is.equal('login')
  })

  it('extending', () => {
    class MBaseUser {
      @str login

      static preProcessSnapshot(snap) {
        return {
          ...snap,
          login: snap.login + '-xxx',
        }
      }
    }
    const BaseUser = model(MBaseUser)

    class MUser extends BaseUser {
      @str firstName

      static preProcessSnapshot(snap) {
        return {
          ...snap,
          firstName: snap.firstName + '-xxx',
        }
      }
    }
    const User = model(MUser)

    const user = User.create({
      login: 'login',
      firstName: 'firstName',
    })

    user.should.have.property('login').which.is.equal('login-xxx')
    user.should.have.property('firstName').which.is.equal('firstName-xxx')
  })
})
