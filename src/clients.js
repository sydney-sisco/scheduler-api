class Clients {
  constructor() {
    this.clientList = {};
    this.saveClient = this.saveClient.bind(this);
  }
  saveClient(name, client) {
    this.clientList[name] = client;
  }
}
