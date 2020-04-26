import 'should'
import {model, str} from '../../src'


describe('listeners', () => {
  it('onSnapshot', done => {
    @model class BaseUser {
      @str login

      setLogin(login) {
        this.login = login
      }

      onSnapshot(snap) {
        snap.should.have.property('login').which.is.equal('new-login')
        done()
      }
    }

    const user = BaseUser.create({
      login: 'login',
    })
    user.setLogin('new-login')
  })

  it('onPatch', done => {
    @model class BaseUser {
      @str login

      setLogin(login) {
        this.login = login
      }

      onPatch(patch, revert) {
        patch.should.have.property('path').which.is.equal('/login')
        patch.should.have.property('value').which.is.equal('new-login')
        revert.should.have.property('path').which.is.equal('/login')
        revert.should.have.property('value').which.is.equal('login')
        done()
      }
    }

    const user = BaseUser.create({
      login: 'login',
    })
    user.setLogin('new-login')
  })

  it('onAction', done => {
    @model class BaseUser {
      @str login

      setLogin(login) {
        this.login = login
      }

      onAction(call) {
        call.should.have.property('name').which.is.equal('setLogin')
        done()
      }
    }

    const user = BaseUser.create({
      login: 'login',
    })
    user.setLogin('new-login')
  })
})
