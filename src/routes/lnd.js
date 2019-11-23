const express = require('express')
const routes = express.Router()
const lnd = require('../middlewares/lnService')
const lnService = require('ln-service')
const lightningController = require('../controllers/lightning')
const moment = require('moment')

routes.get('/listchannels', async (req, res) => {
    const channels = await lnService.getChannels({ lnd })
    return res.json(lightningController.getChannels(channels.channels))
})

routes.get('/forwardingreputation', async (req, res) => {
    const nodes = await lnService.getForwardingReputations({
        lnd
    })
    return res.json(nodes)
})

routes.get('/forwardinghistory', async (req, res) => {
    const history = await lnService.getForwards({ lnd, token: req.query.next })
    return res.json(history)
})

routes.get('/nodeinfo', async (req, res) => {
    const node = await lnService.getWalletInfo({ lnd })
    return res.json(node)
})

routes.get('/uri', async (req, res) => {
    const node = await lnService.getWalletInfo({ lnd })
    return res.json(node.uris[0])
})

routes.get('/watchtower', async (req, res) => {
    const watchtower = await lnService.getTowerServerInfo({ lnd })
    return res.json(watchtower.tower.uris[0])
})

routes.get('/getalias/:id', async (req, res) => {
    const info = await lnService.getNode({ lnd, public_key: req.params.id })
    return res.json(info.alias)
})

routes.post('/createinvoice', async (req, res) => {
    const date = moment()
        .add(1, 'd')
        .toISOString()
    const invoice = await lnService.createInvoice({
        lnd,
        description: 'Donation to LightningBoost.info',
        expires_at: date,
        tokens: req.body.amount
    })
    return res.json(invoice)
})

routes.get('/invoicestatus', async (req, res) => {
    req.setTimeout(86400000)
    const sub = lnService.subscribeToInvoice({ id: req.query.id, lnd })
    sub.on('invoice_updated', invoice => {
        if (invoice.is_confirmed) {
            return res.json({ status: 'Confirmed' })
        }
    })
})

routes.get('/btcaddress', async (req, res) => {
    const { address } = await lnService.createChainAddress({
        lnd,
        format: req.query.format
    })
    return res.json(address)
})

routes.post('/openchannel', async (req, res) => {
    const { tokens, is_private, public_key, socket } = req.body
    try {
        await lnService.addPeer({ lnd, socket, public_key })
        const channel = await lnService.openChannel({
            lnd,
            local_tokens: tokens,
            is_private,
            partner_public_key: public_key,
            chain_fee_tokens_per_vbyte: 5
        })
        return res.json(channel)
    } catch (e) {
        return res.status(e[0]).send({ error: e[2].details })
    }
})

module.exports = routes
