const express = require("express");
const routes = express.Router();
const lnd = require("../middlewares/lnService");
const lnService = require("ln-service");

routes.get("/listchannels", async (req, res) => {
  const channels = await lnService.getChannels({ lnd });
  return res.json(channels);
});

routes.get("/forwardingreputation", async (req, res) => {
  const nodes = await lnService.getForwardingReputations({ lnd });
  return res.json(nodes);
});

routes.get("/forwardinghistory", async (req, res) => {
  const history = await lnService.getForwards({ lnd });
  return res.json(history);
});

routes.get("/nodeinfo", async (req, res) => {
  const node = await lnService.getWalletInfo({ lnd });
  return res.json(node);
});

routes.get("/uri", async (req, res) => {
  const node = await lnService.getWalletInfo({ lnd });
  return res.json(node.uris[0]);
});

routes.get("/watchtower", async (req, res) => {
  const watchtower = await lnService.getTowerServerInfo({ lnd });
  return res.json(watchtower.tower.uris[0]);
});

module.exports = routes;
