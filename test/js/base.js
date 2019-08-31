import {model, prop, view, types as t} from '../../src'
import {timeout} from './utils'


describe('base', () => {
  it('all types', () => {
    @model class C1 {
      @t.str v1
    }
    @model class C2 {
      @t.str v2
    }
    @model class WithId {
      @t.id id
    }
    @model class WithIdNum {
      @t.idNum idNum
    }

    @model class Base {
      @t.id id
      @WithIdNum withIdNum
      @t.str str
      @t.num num
      @t.bool bool
      @t.int int
      @t.date date
      @t.enumeration(['e1', 'e2']) enumeration
      @t.maybe(t.str) maybe
      @t.maybeNull(t.str) maybeNull
      @t.map(t.str) map
      @t.array(t.str) array
      @t.frozen(t.str) frozen
      @t.compose(C1, C2) compose
      @WithId withId
      @t.ref(WithId) ref
      @t.safeRef(WithId) safeRef
      @t.union(C1, C2) union
      @t.opt(t.str, 'opt') opt
      @t.literal('literal') literal
      @t.refinement(t.str, val => val.length > 5) refinement
      @t.undef undef
      @t.null null
      @t.late(() => t.str) late
    }

    const base = Base.create({
      id: 'id',
      withIdNum: {idNum: 1},
      idNum: 1,
      str: 'str',
      num: 1.5,
      int: 1,
      bool: true,
      date: new Date(),
      enumeration: 'e1',
      map: {'a': 'map'},
      frozen: 'frozen',
      array: ['array'],
      compose: {v1: 'v1', v2: 'v2'},
      withId: {id: 'id'},
      ref: 'id',
      safeRef: 'invalid',
      union: {v1: 'v1'},
      literal: 'literal',
      refinement: 'refinement',
      'null': null,
      late: 'late',
    })

    base.should.have.property('id').which.is.equal('id')
    base.should.have.property('withIdNum')
    base.withIdNum.idNum.should.be.equal(1)
    base.should.have.property('str').which.is.equal('str')
    base.should.have.property('num').which.is.equal(1.5)
    base.should.have.property('int').which.is.equal(1)
    base.should.have.property('bool').which.is.true()
    base.should.have.property('date').which.is.instanceof(Date)
    base.should.have.property('enumeration').which.is.equal('e1')
    base.should.have.property('maybe').which.is.undefined()
    base.should.have.property('maybeNull').which.is.null()
    base.should.have.property('map')
    base.map.get('a').should.be.equal('map')
    base.should.have.property('array')
    base.array[0].should.be.equal('array')
    base.should.have.property('frozen').which.is.equal('frozen')
    base.should.have.property('compose')
    base.compose.v1.should.be.equal('v1')
    base.compose.v2.should.be.equal('v2')
    base.should.have.property('ref')
    base.ref.id.should.be.equal('id')
    base.should.have.property('safeRef').which.is.undefined()
    base.should.have.property('union')
    base.union.v1.should.be.equal('v1')
    base.should.have.property('opt').which.is.equal('opt')
    base.should.have.property('literal').which.is.equal('literal')
    base.should.have.property('refinement').which.is.equal('refinement')
    base.should.have.property('undef').which.is.undefined()
    base.should.have.property('null').which.is.null()
    base.should.have.property('late').which.is.equal('late')
  })

  it('prop', () => {
    @model class Base {
      @prop(t.str) prop
    }

    const base = Base.create({
      prop: 'prop',
    })

    base.should.have.property('prop').which.is.equal('prop')
  })

  it('default value', () => {
    @model class Base {
      @t.str str = 'str'
    }

    const base = Base.create()
    base.should.have.property('str').which.is.equal('str')
  })

  it('view', () => {
    @model class Base {
      @t.str str

      get view() {
        return this.str
      }
    }

    const base = Base.create({
      str: 'str',
    })

    base.should.have.property('view').which.is.equal('str')
  })

  it('view with args', () => {
    @model class Base {
      @t.str str

      @view view(prefix) {
        return prefix + this.str
      }
    }

    const base = Base.create({
      str: 'str',
    })

    base.view('xxx-').should.be.equal('xxx-str')
  })

  it('action', () => {
    @model class Base {
      @t.maybe(t.str) str

      setStr(str) {
        this.str = str
      }
    }

    const base = Base.create()
    base.setStr('str')

    base.should.have.property('str').which.is.equal('str')
  })

  it('flow', async () => {
    @model class Base {
      @t.maybe(t.str) str

      *setStr(str) {
        yield timeout(1)
        this.str = str
      }
    }

    const base = Base.create()
    await base.setStr('str')

    base.should.have.property('str').which.is.equal('str')
  })

  it('throw if new', () => {
    @model class Base {}
    (() => {
      new Base()
    }).should.throw()
  })
})
