// not used because I couldn't figure out how to import a class from another file
class Clients {
  constructor() {
    this.clientList = {};
    this.saveClient = this.saveClient.bind(this);
  }
  saveClient(name, client) {
    this.clientList[name] = client;
  }
}
