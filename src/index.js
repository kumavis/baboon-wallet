const uuid = require('hat')
const tornado = require('./tornado')

class Actor {
  constructor () {
    this.id = uuid()
    this.capabilites = []
  }
  addCapability (cap) {
    this.capabilites.push(cap)
  }
  getCapabilityLabels () {
    return this.capabilites
  }
  render () {
    const proto = Object.getPrototypeOf(this)
    const actions = Object.entries(Object.getOwnPropertyDescriptors(proto))
      .filter(([_, { value }]) => typeof value === 'function')
      .filter(([key]) => key !== 'constructor')
    console.log(proto, actions)

    return `
      <br><br>${this.constructor.name}
      <br>caps: ${this.capabilites.join(', ')}
      <br>${actions.map(([key, fn]) => {
        return `<button onclick="callActor('${this.id}', '${key}')">${key}</button>`
      })}
    `
  }
}

class EthActor extends Actor {
  constructor () {
    super()
    this.addCapability('eth:send')
    this.addCapability('eth:receive')
    this.addCapability('eth:address')
    this.address = '0xabcd...'
  }
  // eth:send
  async sendEther (address, value) {
    log(`send (${value}) eth to ${address} from ${this.address}`)
  }
  // eth:receive
  async getDepositParams () {
    return {
      to: this.address,
    }
  }
  // eth:address
  async getAddress () {
    return this.address
  }
}

class TornadoActor extends Actor {
  constructor () {
    super()
    this.addCapability('eth:send')
    this.addCapability('eth:receive')
  }
  // eth:send
  async sendEther (address, value) {
    log(`deposit (${value}) eth into ${address} from tornado deposits`)
  }
  // eth:receive
  async getDepositParams () {
    const tornadoData = await tornado.deposit()
    log(`saving tornado secret: ${tornadoData.noteString}`)

    return {
      to: '0xDependsOnDepositAmount:(',
      data: `0xb214faa5${tornado.toHex(tornadoData.deposit.commitment).slice(2)}`,
    }
  }
}

const state = {
  actors: [
    new EthActor(),
    new TornadoActor(),
  ],
  log: [],
}

window.callActor = async (id, methodName) => {
  const actor = state.actors.find(actor => actor.id === id)
  log(`calling "${methodName}" on actor ${id}`)
  const result = await actor[methodName]()
  log(`called "${methodName}" on actor ${id} and got ${JSON.stringify(result, null, 2)}`)
}

render()

function render () {
  let output = ''
  output += '<br><h3>actors:</h3>'
  state.actors.forEach((actor) => {
    output += `${actor.render()}`
  })
  output += '<br><h3>log:</h3>'
  state.log.forEach((entry) => {
    output += `<pre>${entry}</pre>`
  })
  document.body.innerHTML = output
}

function log (message) {
  state.log.push(message)
  render()
}
