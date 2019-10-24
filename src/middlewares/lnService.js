const lnService = require("ln-service");
const fs = require("fs");

const cert = fs.readFileSync(process.env.LNDCERTPATH);
const macaroon = fs.readFileSync(process.env.LNDMACAROONPATH);

const base64cert = cert.toString("base64");
const base64macaroon = macaroon.toString("base64");

const { lnd } = lnService.authenticatedLndGrpc({
  cert: base64cert,
  macaroon: base64macaroon,
  socket: process.env.LNDIP
});

module.exports = lnd;
